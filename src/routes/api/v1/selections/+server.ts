import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getFileForView } from '$lib/server/storage';
import { createRow, getFirstRow, getRow, tables } from '$lib/server/database';
import { Query, type Models } from 'node-appwrite';

export const POST: RequestHandler = async ({ request }) => {
    const body = await request.json();

    if (!body.uploadId || !body.test || !body.selections) {
        throw error(400, 'Missing uploadId, test, or selections');
    }

    // Get the upload
    let upload: Models.DefaultRow;
    try {
        upload = await getRow(tables.uploads, body.uploadId);
    } catch (err) {
        console.error('Error fetching upload:', err);
        throw error(404, 'Upload not found');
    }

    if (!upload.pages || upload.pages.length === 0) {
        throw error(400, 'Upload has no pages');
    }

    // Get the competition
    let competition: Models.DefaultRow;
    try {
        competition = await getRow(tables.competitions, upload.competitionId);
    } catch (err) {
        console.error('Error fetching competition:', err);
        throw error(404, 'Competition not found');
    }

    // Create question and/or answer rows based on selections
    // questionNumber: questionId
    const createdQuestions: Record<number, string> = {};

    // Create all questions first
    for (const selection of body.selections) {
        if (selection.type === 'question' && !createdQuestions[selection.questionNumber]) {
            try {
                const question = await createRow(tables.questions, {
                    competitionId: competition.$id,
                    test: body.test,
                    questionNumber: selection.questionNumber,
                    pageId: upload.pages[selection.pageNumber - 1], // pageNumber is 1-based
                    x: selection.x,
                    y: selection.y,
                    width: selection.width,
                    height: selection.height
                });
                createdQuestions[selection.questionNumber] = question.$id;
            } catch (err) {
                console.error('Error creating question:', err);
                throw error(500, 'Failed to create question');
            }
        }
    }

    // Create answers for each question
    for (const selection of body.selections) {
        if (selection.type === 'answer') {
            // Determine if a question was created for this questionNumber
            let questionId = createdQuestions[selection.questionNumber];
            if (!questionId) {
                // Try to find an existing question for this questionNumber
                try {
                    const existingQuestion = await getFirstRow(tables.questions, [
                        Query.equal('competitionId', competition.$id),
                        Query.equal('test', body.test),
                        Query.equal('questionNumber', selection.questionNumber)
                    ]);
                    questionId = existingQuestion.$id;
                } catch (err) {
                    console.error('Error fetching existing question:', err);
                    throw error(404, 'Existing question not found');
                }
            }
            // Create the answer
            try {
                await createRow(tables.answers, {
                    competitionId: competition.$id,
                    questionId,
                    pageId: upload.pages[selection.pageNumber - 1], // pageNumber is 1-based
                    x: selection.x,
                    y: selection.y,
                    width: selection.width,
                    height: selection.height
                });
            } catch (err) {
                console.error('Error creating answer:', err);
                throw error(500, 'Failed to create answer');
            }
        }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
};