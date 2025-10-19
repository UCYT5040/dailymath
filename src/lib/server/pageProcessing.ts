import { CronJob } from 'cron';
import { createRow, decrementRowColumn, getFirstRow, incrementRowColumn, listRows, tables, updateRow } from './database';
import { type Models, Query } from 'node-appwrite';
import { getFileForView } from './storage';
import { testNames } from '$lib/tests';
import { ai, isAutoGenerationAllowed } from './ai';

let isProcessorIdle = false;

const prompt = `You are a data entry specialist.
You are given one page of a math contest.
First, determine the page type:
\`questions\` - The page contains questions from the included tests (note that it may skip or exclude some questions: that is, it might not start at question 1)
\`answers\` - The page contains answers to questions from the included tests
\`none\` - The page contains no relevant information or includes a question/answer from a test not in the list
The given tests are: ${Object.keys(testNames).map((key) => `${key} (${testNames[key as keyof typeof testNames]})`).join(', ')
    }
Do not include Relay, Oral, Playoffs, or large print questions (even if the large print questions are from the included tests).
Explanation pages are also not relevant.
Be sure to escape dollar signs if you are not using them for LaTeX formatting.
Question content: Convert any math notation to LaTeX format, using \$ for inline math and \$\$ for display math. Omit any diagrams or images. Feel free to use newlines and lists to format the content for clarity (if applicable). If a question references a diagram or image, note that in the "includesDiagram" field.
Answer content: Provide, first, the answer, in LaTeX format, using \$ for inline math and \$\$ for display math. Then, if applicable, provide any additional instructions (for example, "capitalization optional", "in simplest form", "in decimal form", etc.).
Return the following JSON:
{
    "pageType": "questions" | "answers" | "none",
    "test": string | null, // The test code (e.g., "algebra1") or null if pageType is "none"
    "questions": [
      {
        "number": number, // The question number
        "content": string, // Content of the question
        "includesDiagram": boolean // True if the question includes a diagram or image
      }
    ] | null // null if pageType is "none" or "answers"
    "answers": [
      {
        "number": number, // The question number
        "content": string, // Content of the answer
      }
    ] | null // null if pageType is "none" or "questions"
}
`;

const schema = {
    "type": "object",
    "properties": {
        "pageType": {
            "type": "string",
            "enum": ["questions", "answers", "none"]
        },
        "questions": {
            "type": "array",
            "nullable": true,
            "items": {
                "type": "object",
                "properties": {
                    "number": { "type": "integer" },
                    "content": { "type": "string" },
                    "includesDiagram": { "type": "boolean" }
                },
                "required": ["number", "content", "includesDiagram"]
            }
        },
        "answers": {
            "type": "array",
            "nullable": true,
            "items": {
                "type": "object",
                "properties": {
                    "number": { "type": "integer" },
                    "content": { "type": "string" }
                },
                "required": ["number", "content"]
            }
        },
        "test": { "type": ["string", "null"] }
    }
};

export async function processSinglePage(
    competitionId: string,
    pageId: string,
    options: { override?: boolean } = {}
): Promise<any> {
    // Handle rate limiting
    if (options.override) {
        // Run rate limit check but don't await or check result (just increment count)
        isAutoGenerationAllowed('gemini-2.5-flash').catch(() => {
            // Ignore errors when overriding
        });
    } else {
        // Normal rate limit check
        const allowed = await isAutoGenerationAllowed('gemini-2.5-flash');
        if (!allowed) {
            console.log('Auto-generation limit reached for today, will retry later.');
            return null;
        }
    }

    const pageData = await getFileForView(pageId);

    const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            prompt,
            {
                inlineData: {
                    mimeType: "image/png",
                    data: Buffer.from(pageData).toString('base64'),
                },
            },
        ],
        config: {
            responseMimeType: 'application/json',
            responseSchema: schema,
            thinkingConfig: {
                thinkingBudget: 1000
            }
        }
    });

    let resultData;

    try {
        resultData = JSON.parse(result.text || '');
    } catch (e) {
        console.error('Error parsing AI response JSON:', e);
        console.log('JSON parsing failed, will retry this page later.');
        return null;
    }

    // Validate response structure
    if (!resultData.pageType || (resultData.pageType !== 'none' && !resultData.test) || (resultData.pageType === 'questions' && !resultData.questions) || (resultData.pageType === 'answers' && !resultData.answers)) {
        console.error('AI response is missing required fields or is malformed:', resultData);
        console.log('AI response validation failed, will retry this page later.');
        return null;
    }

    console.log('Processed page result:', resultData);

    if (resultData.pageType === 'questions' && resultData.test && resultData.questions) {
        // For each question, check if a row exists; if not, create it. If it does, update it.
        for (const question of resultData.questions) {
            try {
                const existingRow = await getFirstRow(tables.questions, [
                    Query.equal('competitionId', competitionId),
                    Query.equal('test', resultData.test),
                    Query.equal('questionNumber', question.number)
                ]);
                // Row exists, so update it
                await updateRow(tables.questions, existingRow.$id, {
                    questionContent: question.content,
                    questionPageId: pageId,
                    includesDiagram: question.includesDiagram
                });
            } catch (error) {
                // Row does not exist, so create it
                await createRow(tables.questions, {
                    competitionId: competitionId,
                    test: resultData.test,
                    questionNumber: question.number,
                    questionContent: question.content,
                    questionPageId: pageId,
                    includesDiagram: question.includesDiagram
                });
            }
        }
    } else if (resultData.pageType === 'answers' && resultData.test && resultData.answers) {
        // For each answer, check if a row exists; if not, create it. If it does, update it.
        for (const answer of resultData.answers) {
            try {
                const existingRow = await getFirstRow(tables.questions, [
                    Query.equal('competitionId', competitionId),
                    Query.equal('test', resultData.test),
                    Query.equal('questionNumber', answer.number)
                ]);
                // Row exists, so update it
                await updateRow(tables.questions, existingRow.$id, {
                    answerContent: answer.content,
                    answerPageId: pageId
                });
            } catch (error) {
                // Row does not exist, so create it
                await createRow(tables.questions, {
                    competitionId: competitionId,
                    test: resultData.test,
                    questionNumber: answer.number,
                    answerContent: answer.content,
                    answerPageId: pageId
                });
            }
        }
    }

    return resultData;
}

/*
TODO: Improve counting/tracking of processed pages
Currently, we increment prior to processing. This solves the issue of a race condition where a page is being processed multiple times, but it can lead to skipped pages if processing suddenly fails.
A lock system would be ideal, but is more complex to implement with the current database structure, since pages are stored as an array within the uploads table rather than as separate rows.
*/

async function processQueue() {
    console.log('Checking for documents to process...');

    let document: Models.DefaultRow;
    try {
        document = await getFirstRow(tables.uploads, [
            Query.equal('state', 'processing')
        ]);
    } catch (error) {
        // No documents were found, so we enter an idle state.
        isProcessorIdle = true;
        return;
    }

    if (document.nextPage >= document.pages.length) {
        // All pages processed, mark document as complete
        await updateRow(tables.uploads, document.$id, { state: 'processed' });
        console.log('All pages processed for document:', document.$id);
        return;
    }

    const pageId = document.pages[document.nextPage];

    // Process the page using the extracted function
    const resultData = await processSinglePage(document.competitionId, pageId);

    if (resultData === null) {
        // Processing failed or rate limited, handle accordingly
        if (document.nextPage > 0) {
            await decrementRowColumn(tables.uploads, document.$id, 'nextPage', 1);
        }
        isProcessorIdle = true;
        return;
    }

    // Increment the nextPage index
    if (document.nextPage < document.pages.length - 1) {
        await incrementRowColumn(tables.uploads, document.$id, 'nextPage', 1);
    } else {
        // Mark the document as complete if this was the last page
        await updateRow(tables.uploads, document.$id, { state: 'processed' });
    }

    console.log('PAGE NUMBER:', document.nextPage + 1, 'OF', document.pages.length);

    // Ensure we stay active if more work might exist
    isProcessorIdle = false;

}

export function startCronJobs() {
    console.log('Initializing Cron jobs...');

    new CronJob(
        '*/15 * * * * *', // Every 15 seconds
        () => {
            if (isProcessorIdle) {
                return;
            }
            processQueue();
        },
        null,
        true // Start the job immediately
    ).start();

    new CronJob(
        '*/10 * * * *', // Every 10 minutes
        async () => {
            if (isProcessorIdle) {
                // Check for new work

                const result = await listRows(tables.uploads, [
                    Query.equal('state', 'processing'),
                    Query.limit(1)
                ]);

                if (result.length > 0) {
                    isProcessorIdle = false;
                }
            }
        },
        null,
        true // Start the job immediately
    ).start();
}

// Run when a new upload succeeds to wake up the processor
export function notifyOfNewUpload() {
    isProcessorIdle = false;
}
