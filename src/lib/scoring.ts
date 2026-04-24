import type {
    Contact,
    Job,
    ScoreBreakdown,
    ScoredCandidate,
    MatchReason,
    ScoringWeights,
} from "@/types";
import { DEFAULT_WEIGHTS } from "@/types";
import {
    getEmbedding,
    getEmbeddingsBatch,
    similarityScore,
} from "./embeddings";

function normalize(str: string): string {
    return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function buildJobText(job: Job): string {
    return [
        job.title,
        job.team || "",
        job.location || "",
        job.description || "",
    ]
        .filter(Boolean)
        .join(" ")
        .trim();
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

function scoreExperience(
    contact: Contact,
    job: Job,
): { score: number; reasons: string[] } {
    const jobTitle = normalize(job.title);
    const jobTeam = normalize(job.team || "");
    const reasons: string[] = [];

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

    if (relevantExperience.length === 0) return { score: 20, reasons: [] };

    const totalEntries = contact.experienceSummary.length;
    const relevantRatio = relevantExperience.length / Math.max(totalEntries, 1);
    const hasCurrentRelevant = relevantExperience.some((e) => e.isCurrent);

    if (hasCurrentRelevant) {
        reasons.push(
            `Currently in a relevant role at ${relevantExperience.find((e) => e.isCurrent)?.company || "a company"}`,
        );
    }

    const score = Math.round(
        Math.min(
            100,
            0.5 * relevantRatio * 100 +
                0.3 * (hasCurrentRelevant ? 100 : 0) +
                20,
        ),
    );

    return { score, reasons };
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
        us: ["us", "usa", "unitedstates", "sanfrancisco", "newyork", "ny"],
        uk: ["uk", "unitedkingdom", "london", "england"],
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

    const levels: [string, number][] = [
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

    let jobLevel = 3;
    for (const [keyword, level] of levels) {
        if (jobTitle.includes(keyword)) {
            jobLevel = level;
            break;
        }
    }

    let contactLevel = 3;
    for (const [keyword, level] of levels) {
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
        "computerscience",
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

function scoreCertifications(contact: Contact, job: Job): number {
    if (contact.certifications.length === 0) return 0;

    const jobText = normalize(
        `${job.title} ${job.team || ""} ${job.description || ""}`,
    );
    const certText = normalize(contact.certifications.join(" "));

    const relevantTerms = [
        "aws",
        "azure",
        "gcp",
        "googlecloud",
        "kubernetes",
        "docker",
        "certified",
        "professional",
        "scrum",
        "agile",
        "pmp",
        "security",
        "cissp",
        "ceh",
        "java",
        "python",
        "react",
        "angular",
    ];

    let matches = 0;
    for (const term of relevantTerms) {
        if (jobText.includes(term) && certText.includes(term)) {
            matches++;
        }
    }

    const baseScore = Math.min(100, contact.certifications.length * 25);
    const relevanceBonus = matches * 15;
    return Math.min(100, baseScore + relevanceBonus);
}

function computeConfidence(contact: Contact): number {
    let filled = 0;
    const total = 8;

    if (contact.currentTitle) filled++;
    if (contact.currentCompany) filled++;
    if (contact.headline) filled++;
    if (contact.location) filled++;
    if (contact.about) filled++;
    if (contact.topSkills.length > 0) filled++;
    if (contact.experienceSummary.length > 0) filled++;
    if (contact.educationSummary.length > 0) filled++;

    return Math.round((filled / total) * 100);
}

function buildMatchReasons(
    contact: Contact,
    job: Job,
    breakdown: ScoreBreakdown,
): MatchReason[] {
    const reasons: MatchReason[] = [];

    if (breakdown.skills >= 70) {
        const matchingSkills = contact.topSkills.filter((skill) => {
            const jobText = normalize(
                `${job.title} ${job.team || ""} ${job.description || ""}`,
            );
            return jobText.includes(normalize(skill));
        });
        if (matchingSkills.length > 0) {
            reasons.push({
                label: "Skills Match",
                detail: `Strong overlap: ${matchingSkills.slice(0, 3).join(", ")}`,
            });
        } else {
            reasons.push({
                label: "Skills Match",
                detail: "Semantically aligned with role requirements",
            });
        }
    }

    const expResult = scoreExperience(contact, job);
    if (expResult.score >= 60) {
        expResult.reasons.forEach((r) =>
            reasons.push({ label: "Experience", detail: r }),
        );
    }

    if (job.isRemote) {
        reasons.push({
            label: "Location",
            detail: "Role is remote — location is not a barrier",
        });
    }

    if (contact.openToWork) {
        reasons.push({
            label: "Availability",
            detail: "Actively looking for new opportunities",
        });
    }

    if (breakdown.certifications > 0) {
        reasons.push({
            label: "Certifications",
            detail: `${contact.certifications.length} relevant certification(s)`,
        });
    }

    if (reasons.length === 0) {
        reasons.push({
            label: "General",
            detail: "Moderate overall fit based on combined signals",
        });
    }

    return reasons.slice(0, 4);
}

export async function rankCandidates(
    contacts: Contact[],
    job: Job,
    weights: ScoringWeights = DEFAULT_WEIGHTS,
    useEmbeddings = true,
): Promise<ScoredCandidate[]> {
    const jobText = buildJobText(job);
    const jobEmbedding = useEmbeddings ? await getEmbedding(jobText) : [];
    const embeddingsFailed = useEmbeddings && jobEmbedding.length === 0;
    const effectiveUseEmbeddings = useEmbeddings && !embeddingsFailed;

    const candidateTexts = contacts.map((c) => buildCandidateText(c));

    const embeddings: number[][] = [];
    if (effectiveUseEmbeddings) {
        const BATCH = 50;
        for (let i = 0; i < candidateTexts.length; i += BATCH) {
            const batch = candidateTexts.slice(i, i + BATCH);
            const batchEmbeddings = await getEmbeddingsBatch(batch);
            embeddings.push(...batchEmbeddings);
        }
    }

    const scored = contacts.map((contact, i) => {
        const skills = effectiveUseEmbeddings
            ? similarityScore(jobEmbedding, embeddings[i])
            : scoreSkillsFallback(contact, job);
        const experience = scoreExperience(contact, job).score;
        const location = scoreLocation(contact, job);
        const seniority = scoreSeniority(contact, job);
        const availability = scoreAvailability(contact);
        const education = scoreEducation(contact, job);
        const certifications = scoreCertifications(contact, job);

        const weightSum =
            weights.skills +
            weights.experience +
            weights.location +
            weights.seniority +
            weights.availability +
            weights.education;

        const total =
            Math.round(
                ((skills * weights.skills +
                    experience * weights.experience +
                    location * weights.location +
                    seniority * weights.seniority +
                    availability * weights.availability +
                    education * weights.education +
                    certifications * 0.05) /
                    (weightSum + 0.05)) *
                    100,
            ) / 100;

        const roundedTotal = Math.round(total);

        const breakdown: ScoreBreakdown = {
            skills,
            experience,
            location,
            seniority,
            availability,
            education,
            certifications,
        };

        return {
            contact,
            score: roundedTotal,
            breakdown,
            confidence: computeConfidence(contact),
            matchReasons: buildMatchReasons(contact, job, breakdown),
        };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored;
}

function scoreSkillsFallback(contact: Contact, job: Job): number {
    const jobText = normalize(
        `${job.title} ${job.team || ""} ${job.description || ""}`,
    );
    const candidateSkills = contact.topSkills.map(normalize);

    if (candidateSkills.length === 0) return 30;

    const jobWords = jobText.split(/[\s_-]+/).filter((w) => w.length > 2);
    const jobWordSet = new Set(jobWords);
    let matches = 0;

    for (const skill of candidateSkills) {
        if (jobWordSet.has(skill)) {
            matches++;
            continue;
        }
        for (const word of jobWords) {
            if (skill.includes(word) || word.includes(skill)) {
                matches++;
                break;
            }
        }
    }

    return Math.round(Math.min(100, (matches / candidateSkills.length) * 100));
}
