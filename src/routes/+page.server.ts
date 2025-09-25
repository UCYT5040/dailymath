import { getDailyQuestion } from "$lib/server/dailyQuestion";
import type { PageServerLoad } from "./$types";

const tests = ["algebra1", "geometry", "algebra2", "precalculus", "calculator", "fs2", "js2", "fs8", "js8"] as const;

export const load: PageServerLoad = async () => {
    const questions = [];
    for (const test of tests) {
        try {
            const questionId = await getDailyQuestion(test);
        questions.push({ test, questionId });
        } catch (error) {
            console.error(`Error fetching question for ${test}:`, error);
        }
    }
    return { questions };
};