import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getFileForView } from '$lib/server/storage';
import { getFirstRow, getRow, listRows, tables } from '$lib/server/database';
import { Query, type Models } from 'node-appwrite';

export const GET: RequestHandler = async ({ params, url }) => {
    const { tests } = params;
    const count = url.searchParams.get('count') || '';

    let limit = count ? parseInt(count) : 1;
    if (isNaN(limit) || limit < 1) {
        limit = 1;
    } else if (limit > 10) {
        limit = 10;
    }

    if (!tests) {
        throw error(400, 'Missing tests');
    }

    let parsedTests = tests.split(',');

    let queries = [
        Query.orderRandom(),
        Query.limit(limit)
    ];

    if (parsedTests.length === 1) {
        queries.unshift(Query.equal('test', parsedTests[0]));
    } else {
        queries.unshift(Query.or([...parsedTests.map((test) => Query.equal('test', test))]));
    }

    let questions: Models.DefaultRow[];
    try {
        questions = await listRows(tables.questions, queries);
    } catch (err) {
        console.error('Error fetching question:', err);
        throw error(404, 'Question not found');
    }

    for (let question of questions) {
        question.competition = await getFirstRow(tables.competitions, [
            Query.equal('$id', question.competitionId)
        ]);
        question.explanations = await listRows(tables.explanations, [
            Query.equal('questionId', question.$id)
        ]);
    }

    return json({
        questions
    })
};