"use client";

import type { ScoredCandidate } from "@/types";

interface CandidateTableProps {
    candidates: ScoredCandidate[];
    loading: boolean;
    selectedCandidate: ScoredCandidate | null;
    onSelect: (c: ScoredCandidate) => void;
    onCompare: (c: ScoredCandidate) => void;
    isComparing: (contactId: string) => boolean;
    colWidths: number[];
    onColMouseDown: (idx: number) => (e: React.MouseEvent) => void;
}

function colStyle(idx: number, colWidths: number[]): React.CSSProperties {
    const w = colWidths[idx];
    return w > 0 ? { width: w } : {};
}

export default function CandidateTable({
    candidates,
    loading,
    selectedCandidate,
    onSelect,
    onCompare,
    isComparing,
    colWidths,
    onColMouseDown,
}: CandidateTableProps) {
    return (
        <div className="flex-1 overflow-y-auto">
            <table className="w-full">
                <thead className="sticky top-0 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 select-none z-10">
                    <tr className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        {[
                            "#",
                            "Candidate",
                            "Current Role",
                            "Location",
                            "Score",
                        ].map((h, i) => (
                            <th
                                key={i}
                                className="text-left px-6 py-3 font-medium relative select-none"
                                style={colStyle(i, colWidths)}
                            >
                                {h}
                                <div
                                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-ember/30 transition-colors"
                                    onMouseDown={onColMouseDown(i)}
                                />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="select-none">
                    {loading ? (
                        <tr>
                            <td
                                colSpan={5}
                                className="px-6 py-12 text-center text-neutral-400 dark:text-neutral-500"
                            >
                                Computing embeddings...
                                <div className="text-sm mt-1 text-neutral-500 dark:text-neutral-400">
                                    First run ~30s, then cached
                                </div>
                            </td>
                        </tr>
                    ) : (
                        candidates.map((c, i) => (
                            <tr
                                key={c.contact.id}
                                className={`border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
                                    selectedCandidate?.contact.id ===
                                    c.contact.id
                                        ? "bg-amber-50 dark:bg-amber-900/20"
                                        : ""
                                }`}
                                onClick={() => onSelect(c)}
                            >
                                <td
                                    className="px-6 py-3.5 text-sm text-neutral-400 font-mono"
                                    style={colStyle(0, colWidths)}
                                >
                                    {i + 1}
                                </td>
                                <td
                                    className="px-6 py-3.5"
                                    style={colStyle(1, colWidths)}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="font-medium text-sm text-neutral-800 dark:text-neutral-200">
                                            {c.contact.firstName}{" "}
                                            {c.contact.lastName}
                                        </div>
                                        {c.confidence < 50 && (
                                            <span className="text-[10px] px-1.5 py-0.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded font-medium">
                                                Low data
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td
                                    className="px-6 py-3.5"
                                    style={colStyle(2, colWidths)}
                                >
                                    <div className="text-sm text-neutral-700 dark:text-neutral-300 truncate">
                                        {c.contact.currentTitle}
                                    </div>
                                    <div className="text-xs text-neutral-400 dark:text-neutral-500 truncate">
                                        {c.contact.currentCompany}
                                    </div>
                                </td>
                                <td
                                    className="px-6 py-3.5 text-sm text-neutral-600 dark:text-neutral-400"
                                    style={colStyle(3, colWidths)}
                                >
                                    {c.contact.location}
                                </td>
                                <td
                                    className="px-6 py-3.5"
                                    style={colStyle(4, colWidths)}
                                >
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`text-lg font-bold ${
                                                c.score >= 70
                                                    ? "text-emerald-600 dark:text-emerald-400"
                                                    : c.score >= 40
                                                      ? "text-amber-600 dark:text-amber-400"
                                                      : "text-red-500 dark:text-red-400"
                                            }`}
                                        >
                                            {c.score}
                                        </span>
                                        <span className="text-xs text-neutral-400 font-mono">
                                            /100
                                        </span>
                                        {!isComparing(c.contact.id) && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onCompare(c);
                                                }}
                                                className="text-xs px-1.5 py-0.5 text-neutral-400 hover:text-ember transition-colors"
                                                title="Add to comparison"
                                            >
                                                +
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                    {!loading && candidates.length === 0 && (
                        <tr>
                            <td
                                colSpan={5}
                                className="px-6 py-12 text-center text-neutral-400 dark:text-neutral-500"
                            >
                                No candidates match your filters
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
