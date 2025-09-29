import type { PageServerLoad } from "./$types";
import { getRow, listRows, tables } from "$lib/server/database";
import { Query } from "node-appwrite";

export const load: PageServerLoad = async ({ params, locals }) => {
    const questionId = params.questionId;
    try {
        const question = await getRow(tables.questions, questionId);
        const solutions = await listRows(tables.solutions, [
            Query.equal("questionId", questionId)
        ]);
        const competition = await getRow(tables.competitions, question.competitionId);
        return { question, solutions, competition };
    } catch (error) {
        console.error("Error loading question or solutions:", error);
        return { question: null, solutions: [], competition: null};
    }
};