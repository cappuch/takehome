"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import type { Job, ScoredCandidate, ScoringWeights } from "@/types";
import { DEFAULT_WEIGHTS } from "@/types";
import JobSidebar from "@/components/JobSidebar";
import FilterBar from "@/components/FilterBar";
import CandidateTable from "@/components/CandidateTable";
import CandidateDetail from "@/components/CandidateDetail";
import SettingsModal from "@/components/SettingsModal";

interface PageProps {
    jobs: Job[];
}

const DEFAULT_COL_WIDTHS = [48, 0, 0, 0, 256];

function loadShortlist(): Set<string> {
    try {
        const raw = localStorage.getItem("shortlist");
        if (raw) return new Set(JSON.parse(raw));
    } catch {}
    return new Set();
}

function loadWeights(): ScoringWeights {
    try {
        const raw = localStorage.getItem("scoringWeights");
        if (raw) return JSON.parse(raw);
    } catch {}
    return { ...DEFAULT_WEIGHTS };
}

export default function ClientHome({ jobs }: PageProps) {
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [ranked, setRanked] = useState<ScoredCandidate[]>([]);
    const [selectedCandidate, setSelectedCandidate] =
        useState<ScoredCandidate | null>(null);
    const [search, setSearch] = useState("");
    const [filterOpenToWork, setFilterOpenToWork] = useState(false);
    const [minScore, setMinScore] = useState(0);
    const [panelWidth, setPanelWidth] = useState(450);
    const [colWidths, setColWidths] = useState<number[]>(DEFAULT_COL_WIDTHS);
    const [loading, setLoading] = useState(false);
    const [shortlist, setShortlist] = useState<Set<string>>(loadShortlist);
    const [showSettings, setShowSettings] = useState(false);
    const [weights, setWeights] = useState<ScoringWeights>(loadWeights);
    const [showShortlistOnly, setShowShortlistOnly] = useState(false);

    const panelDragging = useRef(false);
    const panelStartX = useRef(0);
    const panelStartW = useRef(0);

    const colDragging = useRef<number | null>(null);
    const colStartX = useRef(0);
    const colStartW = useRef(0);

    useEffect(() => {
        localStorage.setItem(
            "shortlist",
            JSON.stringify(Array.from(shortlist)),
        );
    }, [shortlist]);

    useEffect(() => {
        localStorage.setItem("scoringWeights", JSON.stringify(weights));
    }, [weights]);

    const toggleShortlist = useCallback((contactId: string) => {
        setShortlist((prev) => {
            const next = new Set(prev);
            if (next.has(contactId)) next.delete(contactId);
            else next.add(contactId);
            return next;
        });
    }, []);

    const exportShortlistCsv = useCallback(() => {
        const shortlisted = ranked.filter((c) => shortlist.has(c.contact.id));
        if (shortlisted.length === 0) return;

        const headers = [
            "Rank",
            "First Name",
            "Last Name",
            "Current Title",
            "Current Company",
            "Location",
            "Score",
            "Skills",
            "Experience",
            "Location Score",
            "Seniority",
            "Availability",
            "Education",
            "Certifications",
            "Confidence",
            "LinkedIn",
        ];
        const rows = shortlisted.map((c, i) => [
            i + 1,
            c.contact.firstName,
            c.contact.lastName,
            c.contact.currentTitle,
            c.contact.currentCompany,
            c.contact.location,
            c.score,
            c.breakdown.skills,
            c.breakdown.experience,
            c.breakdown.location,
            c.breakdown.seniority,
            c.breakdown.availability,
            c.breakdown.education,
            c.breakdown.certifications,
            c.confidence,
            c.contact.linkedinUrl,
        ]);
        const csvContent = [
            headers.join(","),
            ...rows.map((r) =>
                r
                    .map((v) =>
                        typeof v === "string" && v.includes(",") ? `"${v}"` : v,
                    )
                    .join(","),
            ),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `shortlist-${selectedJob?.title || "candidates"}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, [ranked, shortlist, selectedJob]);

    const fetchScores = useCallback(
        async (job: Job) => {
            setLoading(true);
            try {
                const res = await fetch("/api/score", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ jobId: job.id, weights }),
                    signal: AbortSignal.timeout(120000),
                });
                const data = await res.json();
                if (data.candidates) {
                    setRanked(data.candidates);
                }
            } catch (err) {
                console.error("Failed to fetch scores:", err);
            } finally {
                setLoading(false);
            }
        },
        [weights],
    );

    useEffect(() => {
        if (!selectedJob) {
            setRanked([]);
            return;
        }
        fetchScores(selectedJob);
    }, [selectedJob, fetchScores]);

    const handleJobSelect = useCallback((job: Job) => {
        setSelectedJob(job);
        setSelectedCandidate(null);
    }, []);

    const filtered = useMemo(() => {
        return ranked.filter((c) => {
            if (showShortlistOnly && !shortlist.has(c.contact.id)) return false;
            if (filterOpenToWork && !c.contact.openToWork) return false;
            if (c.score < minScore) return false;
            if (search) {
                const q = search.toLowerCase();
                const name =
                    `${c.contact.firstName} ${c.contact.lastName}`.toLowerCase();
                const title = c.contact.currentTitle.toLowerCase();
                const company = c.contact.currentCompany.toLowerCase();
                const skills = c.contact.topSkills.join(" ").toLowerCase();
                if (![name, title, company, skills].some((f) => f.includes(q)))
                    return false;
            }
            return true;
        });
    }, [
        ranked,
        showShortlistOnly,
        shortlist,
        filterOpenToWork,
        minScore,
        search,
    ]);

    const averageScores = useMemo(() => {
        if (ranked.length === 0) {
            return {
                skills: 0,
                experience: 0,
                location: 0,
                seniority: 0,
                availability: 0,
                education: 0,
            };
        }
        const n = ranked.length;
        return {
            skills: Math.round(
                ranked.reduce((s, c) => s + c.breakdown.skills, 0) / n,
            ),
            experience: Math.round(
                ranked.reduce((s, c) => s + c.breakdown.experience, 0) / n,
            ),
            location: Math.round(
                ranked.reduce((s, c) => s + c.breakdown.location, 0) / n,
            ),
            seniority: Math.round(
                ranked.reduce((s, c) => s + c.breakdown.seniority, 0) / n,
            ),
            availability: Math.round(
                ranked.reduce((s, c) => s + c.breakdown.availability, 0) / n,
            ),
            education: Math.round(
                ranked.reduce((s, c) => s + c.breakdown.education, 0) / n,
            ),
        };
    }, [ranked]);

    const onPanelMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            panelDragging.current = true;
            panelStartX.current = e.clientX;
            panelStartW.current = panelWidth;

            const onMove = (ev: MouseEvent) => {
                if (!panelDragging.current) return;
                const dx = panelStartX.current - ev.clientX;
                setPanelWidth(
                    Math.max(300, Math.min(800, panelStartW.current + dx)),
                );
            };
            const onUp = () => {
                panelDragging.current = false;
                window.removeEventListener("mousemove", onMove);
                window.removeEventListener("mouseup", onUp);
            };
            window.addEventListener("mousemove", onMove);
            window.addEventListener("mouseup", onUp);
        },
        [panelWidth],
    );

    const onColMouseDown = useCallback(
        (colIdx: number) => (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            colDragging.current = colIdx;
            colStartX.current = e.clientX;
            colStartW.current = colWidths[colIdx];

            const onMove = (ev: MouseEvent) => {
                if (colDragging.current === null) return;
                const dx = ev.clientX - colStartX.current;
                setColWidths((prev) => {
                    const next = [...prev];
                    next[colDragging.current!] = Math.max(
                        40,
                        colStartW.current + dx,
                    );
                    return next;
                });
            };
            const onUp = () => {
                colDragging.current = null;
                window.removeEventListener("mousemove", onMove);
                window.removeEventListener("mouseup", onUp);
            };
            window.addEventListener("mousemove", onMove);
            window.addEventListener("mouseup", onUp);
        },
        [colWidths],
    );

    const handleWeightChange = (key: keyof ScoringWeights, value: number) => {
        setWeights((prev) => ({ ...prev, [key]: value }));
    };

    const resetWeights = () => {
        setWeights({ ...DEFAULT_WEIGHTS });
    };

    const reRank = () => {
        if (selectedJob) {
            fetchScores(selectedJob);
            setShowSettings(false);
        }
    };

    return (
        <main className="flex h-[calc(100vh-57px)]">
            <JobSidebar
                jobs={jobs}
                selectedJob={selectedJob}
                onSelect={handleJobSelect}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                {!selectedJob ? (
                    <div className="flex-1 flex items-center justify-center text-neutral-400">
                        <div className="text-center">
                            <div className="text-lg font-medium">
                                Select a role to view candidates
                            </div>
                            <div className="text-sm mt-1">
                                Choose from the {jobs.length} open positions
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <FilterBar
                            selectedJob={selectedJob}
                            topScore={
                                ranked.length > 0 ? ranked[0].score : null
                            }
                            rankedCount={ranked.length}
                            filteredCount={filtered.length}
                            search={search}
                            onSearchChange={setSearch}
                            filterOpenToWork={filterOpenToWork}
                            onOpenToWorkChange={setFilterOpenToWork}
                            minScore={minScore}
                            onMinScoreChange={setMinScore}
                            showShortlistOnly={showShortlistOnly}
                            onShortlistOnlyChange={setShowShortlistOnly}
                            shortlistSize={shortlist.size}
                            onExportCsv={exportShortlistCsv}
                            onSettings={() => setShowSettings(true)}
                            canExport={shortlist.size > 0}
                        />
                        <CandidateTable
                            candidates={filtered}
                            loading={loading}
                            selectedCandidate={selectedCandidate}
                            onSelect={setSelectedCandidate}
                            colWidths={colWidths}
                            onColMouseDown={onColMouseDown}
                        />
                    </>
                )}
            </div>

            {selectedCandidate && (
                <CandidateDetail
                    candidate={selectedCandidate}
                    shortlisted={shortlist.has(selectedCandidate.contact.id)}
                    onToggleShortlist={() =>
                        toggleShortlist(selectedCandidate.contact.id)
                    }
                    onClose={() => setSelectedCandidate(null)}
                    panelWidth={panelWidth}
                    onPanelMouseDown={onPanelMouseDown}
                    averageScores={averageScores}
                />
            )}

            {showSettings && (
                <SettingsModal
                    weights={weights}
                    onWeightChange={handleWeightChange}
                    onReset={resetWeights}
                    onCancel={() => setShowSettings(false)}
                    onApply={reRank}
                />
            )}
        </main>
    );
}
