export const reportReasons = {
    missingContent: "The question/answer content is missing or incomplete.",
    incorrectContent: "The question/answer content is incorrect or has errors.",
    explanationIssues: "There is an issue with one or more explanations.",
    inappropriateContent: "The content is inappropriate or offensive.",
    other: "Other (please specify)."
};

export type ReportReason = keyof typeof reportReasons;