import { error, json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getFileForView } from '$lib/server/storage';
import { createRow, getRow, tables } from '$lib/server/database';
import type { Models } from 'node-appwrite';

export const POST: RequestHandler = async ({ params, request }) => {
    const { questionId } = params;

    if (!questionId) {
        throw error(400, 'Missing questionId');
    }

    const form = await request.formData();

    const reason = form.get('reason');
    const details = form.get('details');

    if (!reason) {
        throw error(400, 'Missing report reason');
    }

    let question: Models.DefaultRow;
    try {
        question = await getRow(tables.questions, questionId);
    } catch (err) {
        console.error('Error fetching question:', err);
        throw error(404, 'Question not found');
    }

    await createRow(tables.reports, {
        questionId: question.$id,
        reason,
        details: details || ''
    });

    return redirect(303, `/question/${question.$id}?reported=true`);
};