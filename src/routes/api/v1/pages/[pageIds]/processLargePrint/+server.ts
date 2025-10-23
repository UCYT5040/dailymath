import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { processSinglePage } from '$lib/server/pageProcessing';

export const GET: RequestHandler = async ({ params, url }) => {
    const { pageIds } = params;

    const competitionId = url.searchParams.get('competitionId') || '';

    if (!pageIds) {
        throw error(400, 'Missing pageIds');
    }

    // TODO: Rename processSinglePage to processPages since it can handle multiple pages now (sorry, I know this TODO is in the wrong file)
    let result = await processSinglePage(competitionId, pageIds.split(','), { override: true, allowLargePrint: true });

    return json({ result });
};