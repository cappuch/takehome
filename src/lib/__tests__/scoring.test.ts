import { describe, it, expect } from "vitest";

function normalize(str: string): string {
    return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseDurationYears(duration: string): number {
    if (!duration) return 0;
    const match = duration.match(/(\d+)\s*(yr|year|mo|month)/gi);
    if (!match) return 0;
    let totalMonths = 0;
    for (const m of match) {
        const num = parseInt(m, 10);
        if (m.toLowerCase().includes("yr") || m.toLowerCase().includes("year")) {
            totalMonths += num * 12;
        } else if (m.toLowerCase().includes("mo") || m.toLowerCase().includes("month")) {
            totalMonths += num;
        }
    }
    return totalMonths / 12;
}

function scoreSeniority(contactTitle: string, jobTitle: string): number {
    const levels = [
        ["co-founder", 8],
        ["cofounder", 8],
        ["cto", 8],
        ["ceo", 8],
        ["founder", 8],
        ["vp", 7],
        ["headof", 7],
        ["head ", 7],
        ["director", 6],
        ["principal", 5],
        ["staff", 5],
        ["manager", 5],
        ["lead", 5],
        ["senior", 4],
        ["mid", 3],
        ["associate", 2],
        ["analyst", 2],
        ["junior", 2],
        ["intern", 1],
    ];

    const nj = normalize(jobTitle);
    const nc = normalize(contactTitle);

    let jobLevel = 3;
    for (const [keyword, level] of levels) {
        if (nj.includes(keyword as string)) {
            jobLevel = level as number;
            break;
        }
    }

    let contactLevel = 3;
    for (const [keyword, level] of levels) {
        if (nc.includes(keyword as string)) {
            contactLevel = level as number;
            break;
        }
    }

    const diff = Math.abs(jobLevel - contactLevel);
    return Math.round(Math.max(0, 100 - diff * 25));
}

function scoreAvailability(openToWork: boolean): number {
    return openToWork ? 100 : 50;
}

function computeConfidence(fields: Record<string, unknown>): number {
    let filled = 0;
    const total = 8;
    if (fields.currentTitle) filled++;
    if (fields.currentCompany) filled++;
    if (fields.headline) filled++;
    if (fields.location) filled++;
    if (fields.about) filled++;
    if (fields.topSkills && (fields.topSkills as string[]).length > 0) filled++;
    if (fields.experienceSummary && (fields.experienceSummary as unknown[]).length > 0) filled++;
    if (fields.educationSummary && (fields.educationSummary as unknown[]).length > 0) filled++;
    return Math.round((filled / total) * 100);
}

describe("parseDurationYears", () => {
    it("parses years correctly", () => {
        expect(parseDurationYears("5 yrs")).toBe(5);
        expect(parseDurationYears("3 years")).toBe(3);
    });

    it("parses months correctly", () => {
        expect(parseDurationYears("6 mo")).toBe(0.5);
        expect(parseDurationYears("18 months")).toBe(1.5);
    });

    it("parses combined durations", () => {
        expect(parseDurationYears("2 yrs 6 mo")).toBe(2.5);
        expect(parseDurationYears("1 year 3 months")).toBe(1.25);
    });

    it("returns 0 for empty or invalid input", () => {
        expect(parseDurationYears("")).toBe(0);
        expect(parseDurationYears("2020-2023")).toBe(0);
        expect(parseDurationYears("N/A")).toBe(0);
    });
});

describe("scoreSeniority", () => {
    it("matches exact levels", () => {
        expect(scoreSeniority("Senior Engineer", "Senior Engineer")).toBe(100);
        expect(scoreSeniority("Intern", "Intern")).toBe(100);
    });

    it("handles one-level difference", () => {
        expect(scoreSeniority("Senior Engineer", "Staff Engineer")).toBe(75);
        expect(scoreSeniority("Mid Engineer", "Senior Engineer")).toBe(75);
    });

    it("checks most-specific terms first", () => {
        expect(scoreSeniority("Co-founder", "Founder")).toBe(100);
        expect(scoreSeniority("Senior Staff Engineer", "Staff Engineer")).toBe(100);
    });

    it("handles large gaps", () => {
        expect(scoreSeniority("Intern", "CEO")).toBe(0);
        expect(scoreSeniority("Junior Developer", "Director")).toBe(0);
    });

    it("defaults to mid-level for unknown titles", () => {
        expect(scoreSeniority("Consultant", "Consultant")).toBe(100);
    });
});

describe("scoreAvailability", () => {
    it("returns 100 for open to work", () => {
        expect(scoreAvailability(true)).toBe(100);
    });

    it("returns 50 for not open to work", () => {
        expect(scoreAvailability(false)).toBe(50);
    });
});

describe("computeConfidence", () => {
    it("returns 100 for complete profile", () => {
        expect(computeConfidence({
            currentTitle: "Engineer",
            currentCompany: "Acme",
            headline: "Senior Engineer",
            location: "SF",
            about: "I code",
            topSkills: ["React"],
            experienceSummary: [{}],
            educationSummary: [{}],
        })).toBe(100);
    });

    it("returns 0 for empty profile", () => {
        expect(computeConfidence({
            currentTitle: "",
            currentCompany: "",
            headline: "",
            location: "",
            about: "",
            topSkills: [],
            experienceSummary: [],
            educationSummary: [],
        })).toBe(0);
    });

    it("returns 50 for half-complete profile", () => {
        expect(computeConfidence({
            currentTitle: "Engineer",
            currentCompany: "Acme",
            headline: "",
            location: "",
            about: "",
            topSkills: [],
            experienceSummary: [{}],
            educationSummary: [],
        })).toBe(38);
    });
});

describe("normalize", () => {
    it("lowercases and removes special characters", () => {
        expect(normalize("Senior Engineer")).toBe("seniorengineer");
        expect(normalize("C++ Developer")).toBe("cdeveloper");
    });

    it("handles empty strings", () => {
        expect(normalize("")).toBe("");
    });
});
