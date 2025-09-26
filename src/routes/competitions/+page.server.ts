import type { Actions, PageServerLoad } from "./$types";
import { getRow, listRows, tables, updateRow } from "$lib/server/database";
import type { Models } from "node-appwrite";

export const load: PageServerLoad = async ({ params, locals }) => {
    try {
        const competitions = await listRows(tables.competitions);
        return { competitions  };
    } catch (error) {
        console.error("Error loading competitions:", error);
        return { competitions: [] };
    }
};

export const actions = {
    default: async ({request}) => {
        const formData = await request.formData();

        // For each name that starts with "competition-", update the corresponding competition's active status
        const updates: Promise<Models.DefaultRow>[] = [];
        for (const [name, value] of formData.entries()) {
            if (name.startsWith("competition-")) {
                const competitionId = name.replace("competition-", "");
                const isActive = value === "on";
                updates.push(updateRow(tables.competitions, competitionId, { active: isActive }));
            }
        }
        await Promise.all(updates);
    }
} satisfies Actions;