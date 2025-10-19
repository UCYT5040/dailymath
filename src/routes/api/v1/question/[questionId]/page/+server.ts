import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getFileForView } from '$lib/server/storage';
import { getRow, tables } from '$lib/server/database';
import type { Models } from 'node-appwrite';

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

    const pageId = question.questionPageId;

    let arrayBuffer: ArrayBuffer;
    try {
        arrayBuffer = await getFileForView(pageId);
    } catch (err) {
        console.error('Error fetching page:', err);
    }

    if (!arrayBuffer) {
        throw error(404, 'Page file not found');
    }

    return new Response(arrayBuffer, {
        headers: {
            'Content-Type': 'image/png',
            'Content-Disposition': `inline; filename="${pageId}-${question.$id}.png"`,
            'Cache-Control': `public, max-age=31536000, immutable`,
            'Expires': new Date(Date.now() + 31536000000).toUTCString(),
            'ETag': `"${pageId}-${question.$id}"`,
            'Last-Modified': new Date(question.$createdAt).toUTCString()
        }
    });
};