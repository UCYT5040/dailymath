import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getFileForView } from '$lib/server/storage';
import { getRow, tables } from '$lib/server/database';
import type { Models } from 'node-appwrite';

export const GET: RequestHandler = async ({ params }) => {
    const { uploadId, pageId } = params;

    if (!uploadId || !pageId) {
        throw error(400, 'Missing uploadId or pageId');
    }
    
    let upload: Models.DefaultRow;
    try {
        upload = await getRow(tables.uploads, uploadId);
    } catch (err) {
        console.error('Error fetching upload:', err);
        throw error(404, 'Upload not found');
    }

    if (!upload.pages || !upload.pages.includes(pageId)) {
        throw error(404, 'Page not found in this upload');
    }

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
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${pageId}.png"`
        }
    });
};