import { getFirstRow, getRow, listRows, tables, updateRow } from "$lib/server/database";
import { Query } from "node-appwrite";
import type { Actions, PageServerLoad } from "./$types";
import { get } from "http";

export const load: PageServerLoad = async () => {
    const report = await getFirstRow(tables.reports, [
        Query.orderDesc("$createdAt"),
        Query.equal("resolved", false)
    ]);

    const question = await getRow(tables.questions, report.questionId);

    const competition = await getRow(tables.competitions, question.competitionId);

    const explanations = await listRows(tables.explanations, [
        Query.equal("questionId", question.$id)
    ]);

    const uploads = await listRows(tables.uploads, [
        Query.equal("competitionId", competition.$id)
    ]);

    return {
        ...report,
        question: {
            ...question,
            competition: competition,
            explanations: explanations
        },
        uploads: uploads
    };
};

export const actions = {
	default: async (event) => {
        const formData = await event.request.formData();
        const reportId = formData.get("reportId") as string;
        await updateRow(tables.reports, reportId, {
            resolved: true
        });
	}
} satisfies Actions;