import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getFileForView } from '$lib/server/storage';
import { getRow, tables } from '$lib/server/database';
import type { Models } from 'node-appwrite';
import sharp from 'sharp';

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

    const pageId = question.pageId;

    let arrayBuffer: ArrayBuffer;
    try {
        arrayBuffer = await getFileForView(pageId);
    } catch (err) {
        console.error('Error fetching page:', err);
    }

    if (!arrayBuffer) {
        throw error(404, 'Page file not found');
    }

    const buffer = Buffer.from(arrayBuffer);

    // Crop to question dimensions
    const { x, y, width, height } = question;

    const image = sharp(buffer);
    const metadata = await image.metadata();

    const trueX = Math.floor(x * metadata.width);
    const trueY = Math.floor(y * metadata.height);
    const trueWidth = Math.floor(width * metadata.width);
    const trueHeight = Math.floor(height * metadata.height);

    const croppedBuffer = await image
        .extract({ left: trueX, top: trueY, width: trueWidth, height: trueHeight })
        .toBuffer();

    // Return the cropped image
    const croppedArrayBuffer = croppedBuffer.buffer.slice(croppedBuffer.byteOffset, croppedBuffer.byteOffset + croppedBuffer.byteLength);

    return new Response(croppedArrayBuffer, {
        headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${pageId}.png"`
        }
    });
};