import type { Actions, PageServerLoad } from "./$types";
import { pdf } from "pdf-to-img";
import { promises as fs } from "node:fs";
import {createRow, getRow, listRows, tables, updateRow} from "$lib/server/database";
import { uploadFileToBucket } from "$lib/server/storage";
import type { Models } from "node-appwrite";

export const actions = {
    default: async ({request}) => {
        const formData = await request.formData();

        // Get the competition details
        const competitionId = formData.get("competitionId");
        let competition;
        if (competitionId === "") {
            // Create a new competition (if competition details are provided)
            const year = parseInt(formData.get("year") as string);
            const division = formData.get("division") as "A" | "AA";
            const location = formData.get("location") as "regional" | "state";
            if (!year || !division || !location) {
                return { status: 400, body: { error: "Missing competition details" } };
            }
            try {
                competition = await createRow(tables.competitions, { year, division, location });
            } catch (error) {
                console.error("Error creating competition:", error);
                return { status: 500, body: { error: "Failed to create competition" } };
            }
        } else {
            // Fetch the existing competition
            try {
                competition = await getRow(tables.competitions, competitionId as string);
            } catch (error) {
                console.error("Error fetching competition:", error);
                return { status: 500, body: { error: "Failed to fetch competition" } };
            }
        }

        // Get the uploaded PDF file
        const file = formData.get("file") as File;
        if (!file || file.type !== "application/pdf") {
            return { status: 400, body: { error: "Invalid file type" } };
        }

        // Create an upload row
        let upload: Models.DefaultRow;
        try {
            upload = await createRow(tables.uploads, { competitionId: competition.$id, state: "processing", pages: [] });
        } catch (error) {
            console.error("Error creating upload row:", error);
            return { status: 500, body: { error: "Failed to create upload row" } };
        }

        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        async function processAndUploadPages() {
            const randomPrefix = Math.random().toString(36).substring(2, 15);
            let counter = 1;
            let pageUploadIds: string[] = [];

            const document = await pdf(uint8Array, { scale: 3 });
            for await (const page of document) {
                const pageUpload = await uploadFileToBucket(page, `upload-${randomPrefix}-page-${counter}.png`);
                pageUploadIds.push(pageUpload);
                // Save the page upload ID to the database every 5 pages
                if (counter % 5 === 0) {
                    try {
                        await updateRow(tables.uploads, upload.$id, { pages: pageUploadIds });
                    } catch (error) {
                        console.error("Error updating upload row:", error);
                    }
                }
                counter++;
            }
            // Final update to ensure all pages are saved
            try {
                await updateRow(tables.uploads, upload.$id, { pages: pageUploadIds, state: "processed" });
            } catch (error) {
                console.error("Error updating upload row:", error);
            }
        }

        processAndUploadPages();

        return { status: 200, uploadId: upload.$id, body: { message: "Upload processing started" } };
    }
} satisfies Actions;



export const load: PageServerLoad = async ({ params, locals }) => {
    try {
        const competitions = await listRows(tables.competitions);
        return { competitions };
    } catch (error) {
        console.error("Error loading competitions:", error);
        return { competitions: [] };
    }
};