import { ID, Storage } from "node-appwrite";
import { serverClient } from "./appwrite";
import { APPWRITE_BUCKET_ID } from "$env/static/private";
import { InputFile } from "node-appwrite/file";

const storage = new Storage(serverClient);

export async function uploadFileToBucket(file: Buffer | Blob, name: string): Promise<string> {
    try {
        const response = await storage.createFile({
            bucketId: APPWRITE_BUCKET_ID,
            fileId: ID.unique(),
            file: InputFile.fromBuffer(file, name)
        });
        return response.$id;
    } catch (error) {
        console.error("Error uploading file to bucket:", error);
        throw new Error("Failed to upload file");
    }
}

export async function getFileForView(fileId: string) {
    try {
        return await storage.getFileView({
            bucketId: APPWRITE_BUCKET_ID,
            fileId: fileId
        });
    } catch (error) {
        console.error(`Error getting file view for file ${fileId}:`, error);
        throw new Error("Failed to get file view");
    }
}

export async function getFileForPreview(fileId: string) {
    try {
        return await storage.getFilePreview({
            bucketId: APPWRITE_BUCKET_ID,
            fileId: fileId,
            width: 400
        });
    } catch (error) {
        console.error(`Error getting file preview for file ${fileId}:`, error);
        throw new Error("Failed to get file preview");
    }
}

export async function getFileMetadata(fileId: string) {
    try {
        return await storage.getFile({
            bucketId: APPWRITE_BUCKET_ID,
            fileId: fileId
        });
    } catch (error) {
        console.error(`Error getting file metadata for file ${fileId}:`, error);
        throw new Error("Failed to get file metadata");
    }
}