import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getFileForView } from '$lib/server/storage';
import { createRow, getRow, incrementRowColumn, tables } from '$lib/server/database';
import type { Models } from 'node-appwrite';
import { ai, incrementAIGenerationCount } from '$lib/server/ai';
import { processSinglePage } from '$lib/server/pageProcessing';

export const GET: RequestHandler = async ({ params, url }) => {
    const { pageId } = params;

    const competitionId = url.searchParams.get('competitionId') || '';

    if (!pageId) {
        throw error(400, 'Missing pageId');
    }

    let result = await processSinglePage(competitionId, pageId, { override: true });

    return json({ result });
};