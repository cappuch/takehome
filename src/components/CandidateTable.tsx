"use client";

import type { ScoredCandidate } from "@/types";

interface CandidateTableProps {
    candidates: ScoredCandidate[];
    loading: boolean;
    selectedCandidate: ScoredCandidate | null;
    onSelect: (c: ScoredCandidate) => void;
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
    colWidths,
    onColMouseDown,
}: CandidateTableProps) {
    return (
        <div className="flex-1 overflow-y-auto">
            <table className="w-full">
                <thead className="sticky top-0 bg-neutral-50 border-b border-neutral-200 select-none z-10">
                    <tr className="text-xs text-neutral-500 uppercase tracking-wider">
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
                                className="px-6 py-12 text-center text-neutral-400"
                            >
                                Computing embeddings...
                                <div className="text-sm mt-1 text-neutral-500">
                                    First run ~30s, then cached
                                </div>
                            </td>
                        </tr>
                    ) : (
                        candidates.map((c, i) => (
                            <tr
                                key={c.contact.id}
                                className={`border-b border-neutral-100 hover:bg-neutral-50 transition-colors cursor-pointer ${
                                    selectedCandidate?.contact.id ===
                                    c.contact.id
                                        ? "bg-amber-50"
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
                                    <div className="font-medium text-sm text-neutral-800">
                                        {c.contact.firstName}{" "}
                                        {c.contact.lastName}
                                    </div>
                                </td>
                                <td
                                    className="px-6 py-3.5"
                                    style={colStyle(2, colWidths)}
                                >
                                    <div className="text-sm text-neutral-700 truncate">
                                        {c.contact.currentTitle}
                                    </div>
                                    <div className="text-xs text-neutral-400 truncate">
                                        {c.contact.currentCompany}
                                    </div>
                                </td>
                                <td
                                    className="px-6 py-3.5 text-sm text-neutral-600"
                                    style={colStyle(3, colWidths)}
                                >
                                    {c.contact.location}
                                </td>
                                <td
                                    className="px-6 py-3.5"
                                    style={colStyle(4, colWidths)}
                                >
                                    <span className="text-lg font-bold text-neutral-700">
                                        {c.score}
                                    </span>
                                    <span className="text-xs text-neutral-400 font-mono ml-0.5">
                                        /100
                                    </span>
                                </td>
                            </tr>
                        ))
                    )}
                    {!loading && candidates.length === 0 && (
                        <tr>
                            <td
                                colSpan={5}
                                className="px-6 py-12 text-center text-neutral-400"
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
