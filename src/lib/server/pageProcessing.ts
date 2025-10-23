import { CronJob } from 'cron';
import { createRow, getFirstRow, incrementRowColumn, listRows, tables, updateRow } from './database';
import { type Models, Query } from 'node-appwrite';
import { getFileForView } from './storage';
import { testNames } from '$lib/tests';
import { ai, isAutoGenerationAllowed } from './ai';
import type { GenerateContentResponse } from '@google/genai';

let isProcessorIdle = false;
let isProcessingLocked = false;

// Helper functions for lock management
export function isProcessingCurrentlyLocked(): boolean {
    return isProcessingLocked;
}

// Some 2-person test packets omit small print questions entirely (only including large print versions).
// Report reviewers that see this will select all the large print questions and send them to be processed.
const noLargePrint = ', or large print questions (even if the large print questions are from the included tests)';
const multiplePagesNote = '\n(in this situation you will be given multiple pages, you should treat them as a single page [you may assume all pages will be the same test and type])';

const prompt = (includeLargePrint: boolean, hasMultiplePages: boolean) => `You are a data entry specialist.
You are given one page of a math contest.
First, determine the page type:
\`questions\` - The page contains questions from the included tests (note that it may skip or exclude some questions: that is, it might not start at question 1)
\`answers\` - The page contains answers to questions from the included tests
\`none\` - The page contains no relevant information or includes a question/answer from a test not in the list
The given tests are: ${Object.keys(testNames).map((key) => `${key} (${testNames[key as keyof typeof testNames]})`).join(', ')
    }
Do not include Relay, Oral, Playoffs${includeLargePrint ? '' : noLargePrint}.
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
}${hasMultiplePages ? multiplePagesNote : ''}
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
    pageIds: string | string[],
    options: { override?: boolean, allowLargePrint?: boolean } = {}
): Promise<any> {
    // Check lock system (ignore lock for manual requests with override)
    if (!options.override && isProcessingLocked) {
        console.log('Processing is currently locked, returning early.');
        return null;
    }

    // Set lock for automatic processing (not for manual requests)
    if (!options.override) {
        isProcessingLocked = true;
    }

    try {
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

        let normalPageIds: string[] = [];

        if (Array.isArray(pageIds)) {
            normalPageIds = pageIds;
        } else {
            normalPageIds = [pageIds];
        }

        // TODO: Wait... is this spread operator use even needed? IDK, I'm tired. Leaving it for now.
        const pagePromises = [
            ...(Array.isArray(normalPageIds) ? normalPageIds : [normalPageIds]).map((id) => getFileForView(id))
        ]

        const pageData = await Promise.all(pagePromises);

        const hasMultiplePages = normalPageIds.length > 1;

        const pageDataInline = pageData.map((data) => ({
            inlineData: {
                mimeType: "image/png",
                data: Buffer.from(data).toString('base64'),
            },
        }));

        let result: GenerateContentResponse | null;

        try {
            result = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    prompt(!!options.allowLargePrint, hasMultiplePages),
                    ...pageDataInline
                ],
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: schema,
                    thinkingConfig: {
                        thinkingBudget: 1000
                    },
                    maxOutputTokens: 19000
                }
            });
        } catch (error) {
            console.error('Error during AI content generation:', error);
            result = null;
        }


        let resultData;

        try {
            resultData = JSON.parse(result?.text || '');
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
                        questionPageId: normalPageIds[0], // TODO: Handle multiple page IDs properly (although, this is such a rare case that it might not matter)
                        includesDiagram: question.includesDiagram
                    });
                } catch (error) {
                    // Row does not exist, so create it
                    await createRow(tables.questions, {
                        competitionId: competitionId,
                        test: resultData.test,
                        questionNumber: question.number,
                        questionContent: question.content,
                        questionPageId: normalPageIds[0], // TODO: See above TODO comment
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
                        answerPageId: normalPageIds[0] // TODO: See above TODO comments
                    });
                } catch (error) {
                    // Row does not exist, so create it
                    await createRow(tables.questions, {
                        competitionId: competitionId,
                        test: resultData.test,
                        questionNumber: answer.number,
                        answerContent: answer.content,
                        answerPageId: normalPageIds[0] // TODO: See above TODO comments
                    });
                }
            }
        }

        return resultData;
    } finally {
        // Release lock for automatic processing (not for manual requests)
        if (!options.override) {
            isProcessingLocked = false;
        }
    }
}


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

    console.log('Processing page PID:', pageId, 'for document:', document.$id);

    // Process the page using the extracted function
    const resultData = await processSinglePage(document.competitionId, pageId);

    if (resultData === null) {
        // Processing failed or rate limited, handle accordingly
        isProcessorIdle = true;
        return;
    }

    // Increment the nextPage index only on success
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
