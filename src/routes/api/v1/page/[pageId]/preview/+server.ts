import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getFileForPreview } from '$lib/server/storage';
import { getRow, tables } from '$lib/server/database';
import type { Models } from 'node-appwrite';

export const GET: RequestHandler = async ({ params }) => {
    const { pageId } = params;

    if (!pageId) {
        throw error(400, 'Missing pageId');
    }

    let arrayBuffer: ArrayBuffer;
    try {
        arrayBuffer = await getFileForPreview(pageId);
    } catch (err) {
        console.error('Error fetching page:', err);
    }

    if (!arrayBuffer) {
        throw error(404, 'Page file not found');
    }

    return new Response(arrayBuffer, {
        headers: {
            'Content-Type': 'image/png',
            'Content-Disposition': `inline; filename="${pageId}.png"`,
            'Cache-Control': `public, max-age=31536000, immutable`,
            'Expires': new Date(Date.now() + 31536000000).toUTCString(),
            'ETag': `"${pageId}"`
        }
    });
};