import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getFileForView, getFileMetadata } from '$lib/server/storage';
import { getRow, tables } from '$lib/server/database';
import type { Models } from 'node-appwrite';

export const GET: RequestHandler = async ({ params }) => {
    const { explanationId } = params;

    if (!explanationId) {
        throw error(400, 'Missing explanationId');
    }

    let explanation: Models.DefaultRow;
    try {
        explanation = await getRow(tables.explanations, explanationId);
    } catch (err) {
        console.error('Error fetching explanation:', err);
        throw error(404, 'Explanation not found');
    }

    const imageId = explanation.imageId;

    let fileData;
    try {
        fileData = await getFileMetadata(imageId);
    } catch (err) {
        console.error('Error fetching file metadata:', err);
    }

    let arrayBuffer: ArrayBuffer;
    try {
        arrayBuffer = await getFileForView(imageId);
    } catch (err) {
        console.error('Error fetching asset:', err);
    }

    if (!arrayBuffer) {
        throw error(404, 'Asset file not found');
    }

    const buffer = Buffer.from(arrayBuffer);

    // Cache for 1 year (31,536,000 seconds)
    const maxAge = 31536000;
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    // Return the cropped image/video
    const croppedArrayBuffer = new ArrayBuffer(buffer.byteLength);
    new Uint8Array(croppedArrayBuffer).set(buffer);

    return new Response(croppedArrayBuffer, {
        headers: {
            'Content-Type': fileData?.mimeType || 'application/octet-stream',
            'Content-Disposition': `inline; filename="${imageId}.${fileData?.name?.split('.').pop() || 'dat'}"`,
            'Cache-Control': `public, max-age=${maxAge}, immutable`,
            'Expires': expiryDate.toUTCString(),
            'ETag': `"${imageId}"`,
            'Last-Modified': new Date(explanation.$createdAt).toUTCString()
        }
    });
};