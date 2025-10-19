import { GoogleGenAI } from '@google/genai';
import { GEMINI_API_KEY } from '$env/static/private';
import { createRow, getFirstRow, getRow, incrementRowColumn, tables } from './database';
import { Query } from 'node-appwrite';

export const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY
});

// Limit the number of auto-generations to save room for manual generations
const AUTO_GENERATION_DAILY_LIMITS = {
    'gemini-2.5-flash': 110,
    'gemini-2.5-pro': 20
};

type ModelName = keyof typeof AUTO_GENERATION_DAILY_LIMITS;

interface CachedModelInfo {
    date: string;
    rowId: string;
}

let cachedModelInfo: Partial<Record<ModelName, CachedModelInfo>> = {};

export async function isAutoGenerationAllowed(modelName: ModelName): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    const modelInfo = cachedModelInfo[modelName];

    if (modelInfo?.date != today) {
        delete cachedModelInfo[modelName];

        let modelInfo: CachedModelInfo = { date: today, rowId: '' };

        // Attempt to fetch usage from database, otherwise create new entry
        try {
            let usageEntry = await getFirstRow(tables.aiUsages, [
                Query.equal('modelName', modelName),
                Query.equal('date', today)
            ]);

            modelInfo.rowId = usageEntry.$id;
        } catch (error) {
            // Create new usage entry
            const newEntry = await createRow(tables.aiUsages, {
                modelName: modelName,
                date: today,
                uses: 0
            });
            modelInfo.rowId = newEntry.$id;
        }

        cachedModelInfo[modelName] = modelInfo;
    }

    try {
        await incrementRowColumn(
            tables.aiUsages,
            cachedModelInfo[modelName]!.rowId,
            'uses',
            1,
            AUTO_GENERATION_DAILY_LIMITS[modelName] + 1
        );
    } catch (error) {
        console.log(`Auto-generation limit reached for model ${modelName}`);
        return false;
    }

    return true;
}

export async function incrementAIGenerationCount(modelName: ModelName): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const modelInfo = cachedModelInfo[modelName];

    if (!modelInfo) {
        console.error(`No cached model info found for ${modelName}`);
        return;
    }

    try {
        await incrementRowColumn(
            tables.aiUsages,
            modelInfo.rowId,
            'uses',
            1
        );
    } catch (error) {
        console.error(`Error incrementing AI generation count for ${modelName}:`, error);
    }
}
