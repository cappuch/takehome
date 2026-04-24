"use client";

import type { ScoredCandidate } from "@/types";
import ScoreBar from "./ScoreBar";

interface CandidateDetailProps {
    candidate: ScoredCandidate;
    shortlisted: boolean;
    onToggleShortlist: () => void;
    onClose: () => void;
    onCompare: () => void;
    panelWidth: number;
    onPanelMouseDown: (e: React.MouseEvent) => void;
    averageScores: Record<string, number>;
}

export default function CandidateDetail({
    candidate,
    shortlisted,
    onToggleShortlist,
    onClose,
    onCompare,
    panelWidth,
    onPanelMouseDown,
    averageScores,
}: CandidateDetailProps) {
    const confidenceLabel =
        candidate.confidence >= 80
            ? "High"
            : candidate.confidence >= 50
              ? "Medium"
              : "Low";
    const confidenceColor =
        candidate.confidence >= 80
            ? "text-emerald-600 dark:text-emerald-400"
            : candidate.confidence >= 50
              ? "text-amber-600 dark:text-amber-400"
              : "text-red-500 dark:text-red-400";

    return (
        <>
            <div
                className="w-1.5 cursor-col-resize hover:bg-ember/40 transition-colors bg-neutral-200 dark:bg-neutral-700 shrink-0 relative group"
                onMouseDown={onPanelMouseDown}
            >
                <div className="absolute inset-y-0 -left-1 -right-1" />
            </div>
            <aside
                className="flex flex-col shrink-0 bg-white dark:bg-neutral-900 overflow-hidden"
                style={{ width: panelWidth }}
            >
                <div className="px-5 py-3 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between bg-white dark:bg-neutral-900">
                    <div>
                        <div className="font-semibold text-neutral-800 dark:text-neutral-100">
                            {candidate.contact.firstName}{" "}
                            {candidate.contact.lastName}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                            {candidate.contact.currentTitle} @{" "}
                            {candidate.contact.currentCompany}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onCompare}
                            className="text-xs px-2 py-1 border border-neutral-200 dark:border-neutral-600 rounded text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                            title="Add to comparison"
                        >
                            Compare
                        </button>
                        <button
                            onClick={onToggleShortlist}
                            className={`text-xl transition-colors ${
                                shortlisted
                                    ? "text-amber-500"
                                    : "text-neutral-300 hover:text-amber-400"
                            }`}
                            title={
                                shortlisted
                                    ? "Remove from shortlist"
                                    : "Add to shortlist"
                            }
                        >
                            {shortlisted ? "\u2605" : "\u2606"}
                        </button>
                        <a
                            href={candidate.contact.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-3 py-1.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors font-medium"
                        >
                            Open LinkedIn ↗
                        </a>
                        <button
                            onClick={onClose}
                            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 text-xl leading-none"
                        >
                            &times;
                        </button>
                    </div>
                </div>

                <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="grid grid-cols-3 gap-3 text-center">
                        {[
                            {
                                label: "Skills",
                                value: candidate.breakdown.skills,
                            },
                            {
                                label: "Experience",
                                value: candidate.breakdown.experience,
                            },
                            {
                                label: "Location",
                                value: candidate.breakdown.location,
                            },
                            {
                                label: "Seniority",
                                value: candidate.breakdown.seniority,
                            },
                            {
                                label: "Availability",
                                value: candidate.breakdown.availability,
                            },
                            {
                                label: "Education",
                                value: candidate.breakdown.education,
                            },
                        ].map((s) => (
                            <div key={s.label}>
                                <div className="text-lg font-bold text-neutral-700 dark:text-neutral-200">
                                    {s.value}
                                </div>
                                <div className="text-[10px] text-neutral-400 uppercase tracking-wider">
                                    {s.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <div className="text-xs text-neutral-400 uppercase tracking-wider mb-0.5">
                                Location
                            </div>
                            <div className="text-neutral-700 dark:text-neutral-300">
                                {candidate.contact.location}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-neutral-400 uppercase tracking-wider mb-0.5">
                                Open to Work
                            </div>
                            <div
                                className={
                                    candidate.contact.openToWork
                                        ? "text-emerald-600 dark:text-emerald-400 font-medium"
                                        : "text-neutral-400"
                                }
                            >
                                {candidate.contact.openToWork ? "Yes" : "No"}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-neutral-400 uppercase tracking-wider mb-0.5">
                                Connections
                            </div>
                            <div className="text-neutral-700 dark:text-neutral-300">
                                {candidate.contact.connectionsCount.toLocaleString()}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-neutral-400 uppercase tracking-wider mb-0.5">
                                Headline
                            </div>
                            <div className="text-neutral-700 dark:text-neutral-300 truncate">
                                {candidate.contact.headline}
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="text-xs text-neutral-400 uppercase tracking-wider mb-0.5">
                            Data Confidence
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${
                                        candidate.confidence >= 80
                                            ? "bg-emerald-500"
                                            : candidate.confidence >= 50
                                              ? "bg-amber-500"
                                              : "bg-red-400"
                                    }`}
                                    style={{
                                        width: `${candidate.confidence}%`,
                                    }}
                                />
                            </div>
                            <span
                                className={`text-xs font-medium ${confidenceColor}`}
                            >
                                {confidenceLabel} ({candidate.confidence}%)
                            </span>
                        </div>
                    </div>

                    {candidate.matchReasons.length > 0 && (
                        <div>
                            <div className="text-xs text-neutral-400 uppercase tracking-wider mb-2">
                                Match Reasons
                            </div>
                            <div className="space-y-1.5">
                                {candidate.matchReasons.map((r, i) => (
                                    <div
                                        key={i}
                                        className="flex items-start gap-2 text-sm"
                                    >
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-ember shrink-0" />
                                        <div>
                                            <span className="font-medium text-neutral-800 dark:text-neutral-200">
                                                {r.label}:
                                            </span>{" "}
                                            <span className="text-neutral-600 dark:text-neutral-400">
                                                {r.detail}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {candidate.contact.about && (
                        <div>
                            <div className="text-xs text-neutral-400 uppercase tracking-wider mb-1">
                                About
                            </div>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                {candidate.contact.about}
                            </p>
                        </div>
                    )}

                    <div>
                        <div className="text-xs text-neutral-400 uppercase tracking-wider mb-2">
                            Top Skills
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {candidate.contact.topSkills.map((skill, i) => (
                                <span
                                    key={i}
                                    className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full text-xs font-medium"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="text-xs text-neutral-400 uppercase tracking-wider mb-2">
                            Experience
                        </div>
                        <div className="space-y-2">
                            {candidate.contact.experienceSummary
                                .slice(0, 8)
                                .map((exp, i) => (
                                    <div
                                        key={i}
                                        className="flex items-start gap-2 text-sm"
                                    >
                                        <span
                                            className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${exp.isCurrent ? "bg-ember" : "bg-neutral-300 dark:bg-neutral-600"}`}
                                        />
                                        <div>
                                            <span className="font-medium text-neutral-800 dark:text-neutral-200">
                                                {exp.title}
                                            </span>
                                            {exp.company && (
                                                <span className="text-neutral-500 dark:text-neutral-400">
                                                    {" "}
                                                    @ {exp.company}
                                                </span>
                                            )}
                                            {exp.duration && (
                                                <span className="text-neutral-400 dark:text-neutral-500 ml-1">
                                                    ({exp.duration})
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>

                    {candidate.contact.educationSummary.length > 0 && (
                        <div>
                            <div className="text-xs text-neutral-400 uppercase tracking-wider mb-2">
                                Education
                            </div>
                            <div className="space-y-1">
                                {candidate.contact.educationSummary.map(
                                    (edu, i) => (
                                        <p
                                            key={i}
                                            className="text-sm text-neutral-600 dark:text-neutral-400"
                                        >
                                            {edu.degree}
                                            {edu.field ? `, ${edu.field}` : ""}
                                            {edu.school
                                                ? ` — ${edu.school}`
                                                : ""}
                                        </p>
                                    ),
                                )}
                            </div>
                        </div>
                    )}

                    {candidate.contact.certifications.length > 0 && (
                        <div>
                            <div className="text-xs text-neutral-400 uppercase tracking-wider mb-2">
                                Certifications
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {candidate.contact.certifications.map(
                                    (cert, i) => (
                                        <span
                                            key={i}
                                            className="px-2.5 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium"
                                        >
                                            {cert}
                                        </span>
                                    ),
                                )}
                            </div>
                        </div>
                    )}

                    <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
                        <div className="text-xs text-neutral-400 uppercase tracking-wider mb-3">
                            Score Breakdown vs Average
                        </div>
                        <div className="space-y-2.5">
                            <ScoreBar
                                label="Skills"
                                value={candidate.breakdown.skills}
                                average={averageScores.skills}
                            />
                            <ScoreBar
                                label="Experience"
                                value={candidate.breakdown.experience}
                                average={averageScores.experience}
                            />
                            <ScoreBar
                                label="Location"
                                value={candidate.breakdown.location}
                                average={averageScores.location}
                            />
                            <ScoreBar
                                label="Seniority"
                                value={candidate.breakdown.seniority}
                                average={averageScores.seniority}
                            />
                            <ScoreBar
                                label="Availability"
                                value={candidate.breakdown.availability}
                                average={averageScores.availability}
                            />
                            <ScoreBar
                                label="Education"
                                value={candidate.breakdown.education}
                                average={averageScores.education}
                            />
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
