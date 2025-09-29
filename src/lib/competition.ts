const locations = {
    regional: "Regional",
    state: "State"
}

export type Competition = {
    year: number;
    division: "A" | "AA";
    location: "regional" | "state";
}

export function formatCompetition(competition: Competition) {
    return `${competition.year} ${competition.division} ${locations[competition.location]}`;
}