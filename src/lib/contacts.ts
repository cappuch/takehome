import fs from "fs";
import path from "path";
import type { Contact, ExperienceEntry, EducationEntry } from "@/types";

let cachedContacts: Contact[] | null = null;

function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (inQuotes) {
            if (char === '"') {
                if (i + 1 < line.length && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                current += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ",") {
                result.push(current);
                current = "";
            } else {
                current += char;
            }
        }
    }
    result.push(current);
    return result;
}

function parseExperience(raw: string): ExperienceEntry[] {
    if (!raw || raw.trim() === "") return [];
    return raw.split("|").map((entry) => {
        const trimmed = entry.trim();
        const isCurrent = trimmed.includes("[Current]");
        const cleaned = trimmed.replace(/\s*\[Current\]\s*/g, "");
        const match = cleaned.match(/^(.+?)\s*@\s*(.+?)\s*\((.+?)\)$/);
        if (match) {
            return {
                title: match[1].trim(),
                company: match[2].trim(),
                duration: match[3].trim(),
                isCurrent,
            };
        }
        return { title: trimmed, company: "", duration: "", isCurrent };
    });
}

function parseEducation(raw: string): EducationEntry[] {
    if (!raw || raw.trim() === "") return [];
    return raw.split("|").map((entry) => {
        const parts = entry.split(",").map((s) => s.trim());
        return {
            degree: parts[0] || "",
            field: parts[1] || "",
            school: parts[2] || "",
        };
    });
}

export function loadContacts(): Contact[] {
    if (cachedContacts) return cachedContacts;

    const filePath = path.join(process.cwd(), "data", "contacts.csv");
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const lines = fileContent.split("\n").filter((l) => l.trim() !== "");

    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]);
    const contacts: Contact[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
            row[h] = values[idx] || "";
        });

        contacts.push({
            id: row.id || "",
            firstName: row.firstName || "",
            lastName: row.lastName || "",
            linkedinUrl: row.linkedinUrl || "",
            currentCompany: row.currentCompany || "",
            currentTitle: row.currentTitle || "",
            headline: row.headline || "",
            location: row.location || "",
            about: row.about || "",
            topSkills: (row.topSkills || "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            experienceSummary: parseExperience(row.experienceSummary || ""),
            educationSummary: parseEducation(row.educationSummary || ""),
            connectionsCount: parseInt(row.connectionsCount || "0", 10) || 0,
            openToWork: row.openToWork?.toLowerCase() === "true",
            certifications: (row.certifications || "")
                .split("|")
                .map((s) => s.trim())
                .filter(Boolean),
        });
    }

    cachedContacts = contacts;
    return contacts;
}
