import { Query } from "node-appwrite";
import { listRows, tables } from "./database";


export async function getDailyQuestion(test: "algebra1" | "geometry" | "algebra2" | "precalculus" | "calculator" | "fs2" | "js2" | "fs8" | "js8") {
    // Find the year/division/location of the competition the question will be from
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const seed = `${year}-${month}-${day}-${test}`;
    const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(seed));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const hashInt = parseInt(hashHex.slice(0, 8), 16);
    
    const competitions = await listRows(tables.competitions, [
        Query.equal("active", true),
        Query.select(["year", "division", "location"])
    ]);
    const competitionIndex = hashInt % competitions.length;
    const competition = competitions[competitionIndex];

    // Now create a new seed for the question
    const questionSeed = `${seed}-${competition.year}-${competition.division}-${competition.location}`;
    const questionHashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(questionSeed));
    const questionHashArray = Array.from(new Uint8Array(questionHashBuffer));
    const questionHashHex = questionHashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const questionHashInt = parseInt(questionHashHex.slice(0, 8), 16);

    const questions = await listRows(tables.questions, [
        Query.equal("competitionId", competition.$id),
        Query.equal("test", test)
    ]);
    if (questions.length === 0) {
        throw new Error(`No questions found for ${competition.year} ${competition.division} ${competition.location} ${test}`);
    }
    const questionIndex = questionHashInt % questions.length;

    return {question: questions[questionIndex], competition};
}