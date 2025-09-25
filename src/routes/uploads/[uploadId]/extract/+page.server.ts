import type { PageServerLoad } from "./$types";
import { getRow, listRows, tables } from "$lib/server/database";
import type { Models } from "node-appwrite";

export const load: PageServerLoad = async ({ params, locals }) => {
    try {
        const upload = await getRow(tables.uploads, params.uploadId);
        const competitionData = await getRow(tables.competitions, upload.competitionId);
        return { upload, competitionData };
    } catch (error) {
        console.error("Error loading uploads:", error);
        return { upload: null, competitionData: null };
    }
};