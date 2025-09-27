import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getFileForView } from '$lib/server/storage';
import { getFirstRow, getRow, tables } from '$lib/server/database';
import { Query, type Models } from 'node-appwrite';
import sharp from 'sharp';

export const GET: RequestHandler = async ({ params }) => {
    const { questionId } = params;

    if (!questionId) {
        throw error(400, 'Missing questionId');
    }

    let answer: Models.DefaultRow;
    try {
        answer = await getFirstRow(tables.answers, [
            Query.equal("questionId", questionId)
        ]);
    } catch (err) {
        console.error('Error fetching question:', err);
        throw error(404, 'Question not found');
    }

    const pageId = answer.pageId;

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
    const { x, y, width, height } = answer;

    const image = sharp(buffer);
    const metadata = await image.metadata();

    const trueX = Math.floor(x * metadata.width);
    const trueY = Math.floor(y * metadata.height);
    const trueWidth = Math.floor(width * metadata.width);
    const trueHeight = Math.floor(height * metadata.height);

    const croppedBuffer = await image
        .extract({ left: trueX, top: trueY, width: trueWidth, height: trueHeight })
        .toBuffer();

    // Cache for 1 year (31,536,000 seconds)
    const maxAge = 31536000;
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    // Return the cropped image
    const croppedArrayBuffer = new ArrayBuffer(croppedBuffer.byteLength);
    new Uint8Array(croppedArrayBuffer).set(croppedBuffer);

    return new Response(croppedArrayBuffer, {
        headers: {
            'Content-Type': 'image/png',
            'Content-Disposition': `inline; filename="${pageId}-${answer.$id}.png"`,
            'Cache-Control': `public, max-age=${maxAge}, immutable`,
            'Expires': expiryDate.toUTCString(),
            'ETag': `"${pageId}-${answer.$id}"`,
            'Last-Modified': new Date(answer.$createdAt).toUTCString()
        }
    });
};