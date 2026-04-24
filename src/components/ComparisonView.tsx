"use client";

import type { ScoredCandidate } from "@/types";

interface ComparisonViewProps {
    candidates: ScoredCandidate[];
    shortlist: Set<string>;
    onToggleShortlist: (contactId: string) => void;
    onClose: () => void;
    onRemove: (contactId: string) => void;
}

const SIGNALS: { key: keyof ScoredCandidate["breakdown"]; label: string }[] = [
    { key: "skills", label: "Skills" },
    { key: "experience", label: "Experience" },
    { key: "location", label: "Location" },
    { key: "seniority", label: "Seniority" },
    { key: "availability", label: "Availability" },
    { key: "education", label: "Education" },
    { key: "certifications", label: "Certifications" },
];

export default function ComparisonView({
    candidates,
    shortlist,
    onToggleShortlist,
    onClose,
    onRemove,
}: ComparisonViewProps) {
    const maxScore = Math.max(...candidates.map((c) => c.score));

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-8">
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between shrink-0">
                    <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">
                        Side-by-Side Comparison
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 text-xl leading-none"
                    >
                        &times;
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-2 gap-6">
                        {candidates.map((c) => (
                            <div
                                key={c.contact.id}
                                className={`rounded-lg border-2 p-5 ${
                                    c.score === maxScore
                                        ? "border-amber-400 bg-amber-50/50 dark:bg-amber-900/10"
                                        : "border-neutral-200 dark:border-neutral-700"
                                }`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">
                                            {c.contact.firstName}{" "}
                                            {c.contact.lastName}
                                        </h3>
                                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                            {c.contact.currentTitle} @{" "}
                                            {c.contact.currentCompany}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() =>
                                                onToggleShortlist(c.contact.id)
                                            }
                                            className={`text-lg ${
                                                shortlist.has(c.contact.id)
                                                    ? "text-amber-500"
                                                    : "text-neutral-300 hover:text-amber-400"
                                            }`}
                                        >
                                            {shortlist.has(c.contact.id)
                                                ? "\u2605"
                                                : "\u2606"}
                                        </button>
                                        <button
                                            onClick={() =>
                                                onRemove(c.contact.id)
                                            }
                                            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 text-sm"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>

                                <div className="text-3xl font-bold text-amber-600 mb-4">
                                    {c.score}
                                    <span className="text-sm text-neutral-400 font-normal ml-1">
                                        /100
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    {SIGNALS.map(({ key, label }) => (
                                        <div
                                            key={key}
                                            className="flex items-center gap-2"
                                        >
                                            <span className="text-xs text-neutral-500 dark:text-neutral-400 w-24 shrink-0">
                                                {label}
                                            </span>
                                            <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${
                                                        c.breakdown[key] >= 70
                                                            ? "bg-emerald-500"
                                                            : c.breakdown[
                                                                    key
                                                                ] >= 40
                                                              ? "bg-amber-500"
                                                              : "bg-red-400"
                                                    }`}
                                                    style={{
                                                        width: `${c.breakdown[key]}%`,
                                                    }}
                                                />
                                            </div>
                                            <span className="text-xs font-mono w-8 text-right text-neutral-600 dark:text-neutral-400">
                                                {c.breakdown[key]}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {c.matchReasons.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                                        <div className="text-xs text-neutral-400 uppercase tracking-wider mb-2">
                                            Match Reasons
                                        </div>
                                        <div className="space-y-1">
                                            {c.matchReasons.map((r, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-start gap-2 text-xs"
                                                >
                                                    <span className="mt-1 w-1 h-1 rounded-full bg-ember shrink-0" />
                                                    <span className="text-neutral-600 dark:text-neutral-400">
                                                        <span className="font-medium text-neutral-800 dark:text-neutral-200">
                                                            {r.label}:
                                                        </span>{" "}
                                                        {r.detail}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
