"use client";

import type { Job } from "@/types";

interface FilterBarProps {
    selectedJob: Job;
    topScore: number | null;
    rankedCount: number;
    filteredCount: number;
    search: string;
    onSearchChange: (v: string) => void;
    filterOpenToWork: boolean;
    onOpenToWorkChange: (v: boolean) => void;
    minScore: number;
    onMinScoreChange: (v: number) => void;
    showShortlistOnly: boolean;
    onShortlistOnlyChange: (v: boolean) => void;
    shortlistSize: number;
    onExportCsv: () => void;
    onSettings: () => void;
    canExport: boolean;
}

export default function FilterBar({
    selectedJob,
    topScore,
    rankedCount,
    filteredCount,
    search,
    onSearchChange,
    filterOpenToWork,
    onOpenToWorkChange,
    minScore,
    onMinScoreChange,
    showShortlistOnly,
    onShortlistOnlyChange,
    shortlistSize,
    onExportCsv,
    onSettings,
    canExport,
}: FilterBarProps) {
    return (
        <div className="px-6 py-4 border-b border-neutral-200 bg-white shrink-0">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-bold text-neutral-800">
                        {selectedJob.title}
                    </h1>
                    <div className="flex items-center gap-3 mt-1 text-sm text-neutral-500">
                        {selectedJob.team && <span>{selectedJob.team}</span>}
                        {selectedJob.isRemote && (
                            <span className="text-emerald-600 font-medium">
                                Remote
                            </span>
                        )}
                        <span>{selectedJob.location}</span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-ember">
                        {topScore ?? "-"}
                    </div>
                    <div className="text-xs text-neutral-400">Top Match</div>
                </div>
            </div>

            <div className="flex items-center gap-3 mt-4">
                <input
                    type="text"
                    placeholder="Search candidates..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ember/30 focus:border-ember w-64"
                />
                <label className="flex items-center gap-1.5 text-sm text-neutral-600 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={filterOpenToWork}
                        onChange={(e) => onOpenToWorkChange(e.target.checked)}
                        className="rounded border-neutral-300 text-ember focus:ring-ember"
                    />
                    Open to Work
                </label>
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <span>Min score:</span>
                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={minScore}
                        onChange={(e) =>
                            onMinScoreChange(Number(e.target.value))
                        }
                        className="w-24 accent-ember"
                    />
                    <span className="font-mono w-6">{minScore}</span>
                </div>
                <button
                    onClick={() => onShortlistOnlyChange(!showShortlistOnly)}
                    className={`px-2.5 py-1 text-sm rounded-lg border transition-colors ${
                        showShortlistOnly
                            ? "bg-amber-50 border-amber-200 text-amber-700"
                            : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                    }`}
                >
                    Shortlisted ({shortlistSize})
                </button>
                <button
                    onClick={onExportCsv}
                    disabled={!canExport}
                    className="px-2.5 py-1 text-sm rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Export CSV
                </button>
                <button
                    onClick={onSettings}
                    className="px-2.5 py-1 text-sm rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors ml-auto"
                >
                    Settings
                </button>
                <div className="text-sm text-neutral-400">
                    {filteredCount} of {rankedCount} candidates
                </div>
            </div>
        </div>
    );
}
