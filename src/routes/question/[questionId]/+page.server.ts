import { getRow, listRows, tables } from "$lib/server/database";
import { Query } from "node-appwrite";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, url }) => {
    const { questionId } = params;
    const reported = url.searchParams.get("reported");

    const questionData = await getRow(tables.questions, questionId);

    const competitionData = await getRow(tables.competitions, questionData.competitionId);

    const explanationsData = await listRows(tables.explanations, [
        Query.equal("questionId", questionData.$id)
    ]);

    return {
        ...questionData,
        competition: competitionData,
        explanations: explanationsData,
        reported: reported === "true"
    };
}