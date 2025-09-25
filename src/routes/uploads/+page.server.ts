import type { PageServerLoad } from "./$types";
import { getRow, listRows, tables } from "$lib/server/database";
import type { Models } from "node-appwrite";

export const load: PageServerLoad = async ({ params, locals }) => {
    try {
        const uploads = await listRows(tables.uploads);
        const competitionData: Record<string, Models.DefaultRow> = {};
        for (const upload of uploads) {
            if (upload.competitionId && !competitionData[upload.competitionId]) {
                try {
                    const competition = await getRow(tables.competitions, upload.competitionId);
                    competitionData[upload.competitionId] = competition;
                } catch (error) {
                    console.error("Error loading competition:", error);
                }
            }
        }
        return { uploads, competitionData };
    } catch (error) {
        console.error("Error loading uploads:", error);
        return { uploads: [], competitionData: {} };
    }
};