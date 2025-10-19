import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getFileForView } from '$lib/server/storage';
import { createRow, getRow, incrementRowColumn, tables } from '$lib/server/database';
import type { Models } from 'node-appwrite';
import { ai, incrementAIGenerationCount } from '$lib/server/ai';

export const GET: RequestHandler = async ({ params }) => {
    const { questionId } = params;

    if (!questionId) {
        throw error(400, 'Missing questionId');
    }

    let question: Models.DefaultRow;
    try {
        question = await getRow(tables.questions, questionId);
    } catch (err) {
        console.error('Error fetching question:', err);
        throw error(404, 'Question not found');
    }

    const prompt = `You are an AI mathematics competition coach. Provide a detailed, step-by-step explanation for the question below.
Students are allowed to use graphing calculators (including CAS functionality), geometric tools, and, if skilled in programming, may write small programs to assist in calculations or visualizations.
Use LaTeX formatting for all mathematical expressions, and Markdown for markup. Consider providing alternative solution methods if applicable.
Do not refer to yourself in the explanation, or respond with anything other than the explanation itself.

Question:
${question.questionContent}

Answer:
${question.answerContent}
`;
    // Increment AI usage count (but do not await, it is assumed to succeed)
    incrementAIGenerationCount('gemini-2.5-pro');
    
    let response = await ai.models.generateContent({
        contents: prompt,
        model: 'gemini-2.5-pro',
        config: {
            thinkingConfig: {
                thinkingBudget: 3000
            }
        }
    });

    console.log(response);

    console.log(response.text);

    const explanation = await createRow(tables.explanations, {
        questionId: question.$id,
        textContent: response.text,
        aiGenerated: true
    });

    return json({
        explanation
    });
};