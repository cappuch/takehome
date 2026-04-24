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
    total: number;
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
