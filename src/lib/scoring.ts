import type { Contact, Job } from "@/types";
import {
    getEmbedding,
    getEmbeddingsBatch,
    similarityScore,
} from "./embeddings";

export interface ScoreBreakdown {
    skills: number;
    experience: number;
    location: number;
    seniority: number;
    availability: number;
    education: number;
}

export interface ScoredCandidate {
    contact: Contact;
    score: number;
    breakdown: ScoreBreakdown;
}

function normalize(str: string): string {
    return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function buildJobText(job: Job): string {
    return `${job.title} ${job.team || ""} ${job.location || ""}`.trim();
}

function buildCandidateText(contact: Contact): string {
    return [
        contact.currentTitle,
        contact.currentCompany,
        contact.headline,
        ...contact.topSkills,
        contact.about?.substring(0, 500) || "",
        ...contact.experienceSummary
            .slice(0, 5)
            .map((e) => `${e.title} ${e.company}`),
        ...contact.educationSummary
            .slice(0, 2)
            .map((e) => `${e.degree} ${e.field}`),
    ]
        .filter(Boolean)
        .join(" ");
}

function scoreExperience(contact: Contact, job: Job): number {
    const jobTitle = normalize(job.title);
    const jobTeam = normalize(job.team || "");

    const relevantExperience = contact.experienceSummary.filter((exp) => {
        const title = normalize(exp.title);
        const company = normalize(exp.company);
        const combined = `${title} ${company}`;
        const jobWords = jobTitle.split(/[\s_-]+/).filter((w) => w.length > 2);
        const teamWords = jobTeam.split(/[\s_-]+/).filter((w) => w.length > 2);

        for (const w of [...jobWords, ...teamWords]) {
            if (title.includes(w) || combined.includes(w)) return true;
        }
        return false;
    });

    if (relevantExperience.length === 0) return 20;

    const totalDuration = contact.experienceSummary.length;
    const relevantRatio =
        relevantExperience.length / Math.max(totalDuration, 1);
    const hasCurrentRelevant = relevantExperience.some((e) => e.isCurrent);

    return Math.round(
        Math.min(
            100,
            0.5 * relevantRatio * 100 +
                0.3 * (hasCurrentRelevant ? 100 : 0) +
                20,
        ),
    );
}

function scoreLocation(contact: Contact, job: Job): number {
    if (job.isRemote) return 100;

    const contactLoc = normalize(contact.location);
    const jobLoc = normalize(job.location);

    if (!jobLoc || jobLoc === "") return 50;

    const contactParts = contactLoc.split(/[\s,]+/);
    const jobParts = jobLoc.split(/[\s,]+/);

    for (const jp of jobParts) {
        if (jp.length < 2) continue;
        for (const cp of contactParts) {
            if (cp.includes(jp) || jp.includes(cp)) return 100;
        }
    }

    const countryMap: Record<string, string[]> = {
        us: [
            "us",
            "usa",
            "united states",
            "san francisco",
            "new york",
            "ca",
            "ny",
        ],
        uk: ["uk", "united kingdom", "london", "england"],
        eu: [
            "europe",
            "germany",
            "france",
            "netherlands",
            "italy",
            "spain",
            "portugal",
            "berlin",
            "amsterdam",
        ],
        in: ["india", "mumbai", "bangalore", "delhi"],
    };

    for (const [, keywords] of Object.entries(countryMap)) {
        const contactInRegion = keywords.some((k) => contactLoc.includes(k));
        const jobInRegion = keywords.some((k) => jobLoc.includes(k));
        if (contactInRegion && jobInRegion) return 70;
    }

    return 30;
}

function scoreSeniority(contact: Contact, job: Job): number {
    const jobTitle = normalize(job.title);
    const contactTitle = normalize(contact.currentTitle);

    const levels: Record<string, number> = {
        intern: 1,
        junior: 2,
        associate: 2,
        analyst: 2,
        mid: 3,
        senior: 4,
        lead: 5,
        principal: 5,
        staff: 5,
        manager: 5,
        director: 6,
        vp: 7,
        head: 7,
        cto: 8,
        ceo: 8,
        founder: 8,
        "co-founder": 8,
        "co founder": 8,
    };

    let jobLevel = 3;
    for (const [keyword, level] of Object.entries(levels)) {
        if (jobTitle.includes(keyword)) {
            jobLevel = level;
            break;
        }
    }

    let contactLevel = 3;
    for (const [keyword, level] of Object.entries(levels)) {
        if (contactTitle.includes(keyword)) {
            contactLevel = level;
            break;
        }
    }

    const diff = Math.abs(jobLevel - contactLevel);
    return Math.round(Math.max(0, 100 - diff * 25));
}

function scoreAvailability(contact: Contact): number {
    return contact.openToWork ? 100 : 50;
}

function scoreEducation(contact: Contact, job: Job): number {
    const jobTitle = normalize(job.title);
    const jobTeam = normalize(job.team || "");
    const jobText = `${jobTitle} ${jobTeam}`;
    const eduFields = contact.educationSummary
        .map((e) => normalize(`${e.field} ${e.degree}`))
        .join(" ");

    const relevantTerms = [
        "computer science",
        "engineering",
        "data",
        "math",
        "physics",
        "business",
        "finance",
        "economics",
        "design",
        "marketing",
    ];

    for (const term of relevantTerms) {
        if (jobText.includes(term) && eduFields.includes(term)) return 80;
    }

    if (contact.educationSummary.length > 0) return 50;
    return 30;
}

export interface ScoringWeights {
    skills: number;
    experience: number;
    location: number;
    seniority: number;
    availability: number;
    education: number;
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
    skills: 0.45,
    experience: 0.2,
    location: 0.15,
    seniority: 0.1,
    availability: 0.05,
    education: 0.05,
};

export async function rankCandidates(
    contacts: Contact[],
    job: Job,
    weights: ScoringWeights = DEFAULT_WEIGHTS,
): Promise<ScoredCandidate[]> {
    const jobText = buildJobText(job);
    const jobEmbedding = await getEmbedding(jobText);

    const candidateTexts = contacts.map((c) => buildCandidateText(c));

    const BATCH = 50;
    const embeddings: number[][] = [];

    for (let i = 0; i < candidateTexts.length; i += BATCH) {
        const batch = candidateTexts.slice(i, i + BATCH);
        const batchEmbeddings = await getEmbeddingsBatch(batch);
        embeddings.push(...batchEmbeddings);
    }

    const scored = contacts.map((contact, i) => {
        const skills = similarityScore(jobEmbedding, embeddings[i]);
        const experience = scoreExperience(contact, job);
        const location = scoreLocation(contact, job);
        const seniority = scoreSeniority(contact, job);
        const availability = scoreAvailability(contact);
        const education = scoreEducation(contact, job);

        const total = Math.round(
            skills * weights.skills +
                experience * weights.experience +
                location * weights.location +
                seniority * weights.seniority +
                availability * weights.availability +
                education * weights.education,
        );

        return {
            contact,
            score: total,
            breakdown: {
                skills,
                experience,
                location,
                seniority,
                availability,
                education,
            },
        };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored;
}
