export const tests = ["algebra1", "geometry", "algebra2", "precalculus", "calculator", "fs2", "js2", "fs8", "js8"] as const;

export type Test = (typeof tests)[number];

export const testNames: Record<Test, string> = {
    algebra1: "Algebra 1",
    geometry: "Geometry",
    algebra2: "Algebra 2",
    precalculus: "Precalculus",
    calculator: "Calculator",
    fs2: "Freshman/Sophomore 2",
    js2: "Junior/Senior 2",
    fs8: "Freshman/Sophomore 8",
    js8: "Junior/Senior 8"
};
