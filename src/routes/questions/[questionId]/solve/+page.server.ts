import type { Actions, PageServerLoad } from "./$types";
import { createRow, getRow, listRows, tables } from "$lib/server/database";
import { type Models, Query } from "node-appwrite";
import { uploadFileToBucket } from "$lib/server/storage";

export const actions = {
    default: async ({params, request}) => {
        const formData = await request.formData();

        const questionId = params.questionId;
        
        // Ensure the question exists (note that we don't need the question data here, just its existence)
        try {
            await getRow(tables.questions, questionId, [Query.select(["$id"])]); // Fetch only the ID to minimize data transfer
        } catch (error) {
            console.error("Error fetching question:", error);
            return { status: 500, body: { error: "Failed to fetch question" } };
        }

        // Get the uploaded image/video file
        const file = formData.get("solution") as File;
        console.log(file);
        console.log(file?.type);
        if (!file || (!file.type.startsWith("image/") && !file.type.startsWith("video/"))) {
            return { status: 400, body: { error: "Invalid file type" } };
        }

        // Upload the file to storage
        let upload;
        try {
            upload = await uploadFileToBucket(file, `solution-${Math.random().toString(36).substring(2, 15)}-${file.name}`);
        } catch (error) {
            console.error("Error uploading file to storage:", error);
            return { status: 500, body: { error: "Failed to upload file" } };
        }

        // Create a solution row
        let solution: Models.DefaultRow;
        try {
            // Since authentication is not yet implemented, set authorId to "0"
            // TODO: Replace "0" with actual user ID when authentication is added
            solution = await createRow(tables.solutions, { questionId, authorId: "0", type: file.type.startsWith("image/") ? "image" : "video", assetId: upload });
        } catch (error) {
            console.error("Error creating solution row:", error);
            return { status: 500, body: { error: "Failed to create solution row" } };
        }

        return { status: 200 };
    }
} satisfies Actions;

export const load: PageServerLoad = async ({ params, locals }) => {
    const questionId = params.questionId;
    try {
        const question = await getRow(tables.questions, questionId);
        const competition = await getRow(tables.competitions, question.competitionId);
        return { question, competition };
    } catch (error) {
        console.error("Error loading question or solutions:", error);
        return { question: null, competition: null };
    }
};