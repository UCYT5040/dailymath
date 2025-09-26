const locations = {
    regional: "Regional",
    state: "State"
}

export function formatCompetition(competition: { year: number; division: "A" | "AA", location: "regional" | "state" }) {
    return `${competition.year} ${competition.division} ${locations[competition.location]}`;
}