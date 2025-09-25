export function formatCompetition(competition: { year: number; division: "A" | "AA", location: "regional" | "state" }) {
    return `${competition.year} ${competition.division} ${competition.location}`;
}