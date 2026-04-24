export interface Contact {
    id: string;
    firstName: string;
    lastName: string;
    linkedinUrl: string;
    currentCompany: string;
    currentTitle: string;
    headline: string;
    location: string;
    about: string;
    topSkills: string[];
    experienceSummary: ExperienceEntry[];
    educationSummary: EducationEntry[];
    connectionsCount: number;
    openToWork: boolean;
    certifications: string[];
}

export interface ExperienceEntry {
    title: string;
    company: string;
    duration: string;
    isCurrent: boolean;
}

export interface EducationEntry {
    degree: string;
    field: string;
    school: string;
}

export interface Job {
    id: string;
    title: string;
    location: string;
    team: string;
    workplaceType: string | null;
    compensation: string | null;
    salaryMin: number | null;
    salaryMax: number | null;
    isRemote: boolean;
    hasEquity: boolean;
    region: string | null;
    description?: string;
}

export interface ScoreBreakdown {
    skills: number;
    experience: number;
    location: number;
    seniority: number;
    availability: number;
    education: number;
    certifications: number;
}

export interface MatchReason {
    label: string;
    detail: string;
}

export interface ScoredCandidate {
    contact: Contact;
    score: number;
    breakdown: ScoreBreakdown;
    confidence: number;
    matchReasons: MatchReason[];
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

export const WEIGHT_LABELS: Record<keyof ScoringWeights, string> = {
    skills: "Skills Match",
    experience: "Experience",
    location: "Location",
    seniority: "Seniority",
    availability: "Availability",
    education: "Education",
};
