"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import type { Contact, Job } from "@/types";

interface ScoreBreakdown {
    skills: number;
    experience: number;
    location: number;
    seniority: number;
    availability: number;
    education: number;
}

interface ScoredCandidate {
    contact: Contact;
    score: number;
    breakdown: ScoreBreakdown;
}

interface ScoringWeights {
    skills: number;
    experience: number;
    location: number;
    seniority: number;
    availability: number;
    education: number;
}

const DEFAULT_WEIGHTS: ScoringWeights = {
    skills: 0.45,
    experience: 0.2,
    location: 0.15,
    seniority: 0.1,
    availability: 0.05,
    education: 0.05,
};

const WEIGHT_LABELS: Record<keyof ScoringWeights, string> = {
    skills: "Skills Match",
    experience: "Experience",
    location: "Location",
    seniority: "Seniority",
    availability: "Availability",
    education: "Education",
};

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

    const colStyle = (idx: number): React.CSSProperties => {
        const w = colWidths[idx];
        return w > 0 ? { width: w } : {};
    };

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

    const weightTotal = Object.values(weights).reduce((a, b) => a + b, 0);

    return (
        <main className="flex h-[calc(100vh-57px)]">
            <aside className="w-72 border-r border-neutral-200 bg-neutral-50 flex flex-col shrink-0">
                <div className="px-5 py-4 border-b border-neutral-200 bg-white">
                    <h2 className="font-semibold text-neutral-800">
                        Open Roles
                    </h2>
                    <p className="text-xs text-neutral-400 mt-0.5">
                        {jobs.length} positions
                    </p>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {jobs.map((job) => (
                        <button
                            key={job.id}
                            onClick={() => handleJobSelect(job)}
                            className={`w-full text-left px-5 py-3.5 border-b border-neutral-100 transition-colors hover:bg-white ${
                                selectedJob?.id === job.id
                                    ? "bg-white border-l-2 border-l-ember"
                                    : ""
                            }`}
                        >
                            <div className="font-medium text-sm text-neutral-800 truncate">
                                {job.title}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                {job.team && (
                                    <span className="text-xs text-neutral-400 truncate">
                                        {job.team}
                                    </span>
                                )}
                                {job.isRemote && (
                                    <span className="text-xs px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded font-medium">
                                        Remote
                                    </span>
                                )}
                            </div>
                            {job.location && (
                                <div className="text-xs text-neutral-400 mt-0.5 truncate">
                                    {job.location}
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </aside>

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
                        <div className="px-6 py-4 border-b border-neutral-200 bg-white shrink-0">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-lg font-bold text-neutral-800">
                                        {selectedJob.title}
                                    </h1>
                                    <div className="flex items-center gap-3 mt-1 text-sm text-neutral-500">
                                        {selectedJob.team && (
                                            <span>{selectedJob.team}</span>
                                        )}
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
                                        {ranked.length > 0
                                            ? ranked[0].score
                                            : "-"}
                                    </div>
                                    <div className="text-xs text-neutral-400">
                                        Top Match
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mt-4">
                                <input
                                    type="text"
                                    placeholder="Search candidates..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="px-3 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ember/30 focus:border-ember w-64"
                                />
                                <label className="flex items-center gap-1.5 text-sm text-neutral-600 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={filterOpenToWork}
                                        onChange={(e) =>
                                            setFilterOpenToWork(
                                                e.target.checked,
                                            )
                                        }
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
                                            setMinScore(Number(e.target.value))
                                        }
                                        className="w-24 accent-ember"
                                    />
                                    <span className="font-mono w-6">
                                        {minScore}
                                    </span>
                                </div>
                                <button
                                    onClick={() =>
                                        setShowShortlistOnly(!showShortlistOnly)
                                    }
                                    className={`px-2.5 py-1 text-sm rounded-lg border transition-colors ${
                                        showShortlistOnly
                                            ? "bg-amber-50 border-amber-200 text-amber-700"
                                            : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                                    }`}
                                >
                                    Shortlisted ({shortlist.size})
                                </button>
                                <button
                                    onClick={exportShortlistCsv}
                                    disabled={shortlist.size === 0}
                                    className="px-2.5 py-1 text-sm rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Export CSV
                                </button>
                                <button
                                    onClick={() => setShowSettings(true)}
                                    className="px-2.5 py-1 text-sm rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors ml-auto"
                                >
                                    Settings
                                </button>
                                <div className="text-sm text-neutral-400">
                                    {filtered.length} of {ranked.length}{" "}
                                    candidates
                                </div>
                            </div>
                        </div>

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
                                                style={colStyle(i)}
                                            >
                                                {h}
                                                <div
                                                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-ember/30 transition-colors"
                                                    onMouseDown={onColMouseDown(
                                                        i,
                                                    )}
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
                                        filtered.map((c, i) => (
                                            <tr
                                                key={c.contact.id}
                                                className={`border-b border-neutral-100 hover:bg-neutral-50 transition-colors cursor-pointer ${
                                                    selectedCandidate?.contact
                                                        .id === c.contact.id
                                                        ? "bg-amber-50"
                                                        : ""
                                                }`}
                                                onClick={() =>
                                                    setSelectedCandidate(c)
                                                }
                                            >
                                                <td
                                                    className="px-6 py-3.5 text-sm text-neutral-400 font-mono"
                                                    style={colStyle(0)}
                                                >
                                                    {i + 1}
                                                </td>
                                                <td
                                                    className="px-6 py-3.5"
                                                    style={colStyle(1)}
                                                >
                                                    <div className="font-medium text-sm text-neutral-800">
                                                        {c.contact.firstName}{" "}
                                                        {c.contact.lastName}
                                                    </div>
                                                </td>
                                                <td
                                                    className="px-6 py-3.5"
                                                    style={colStyle(2)}
                                                >
                                                    <div className="text-sm text-neutral-700 truncate">
                                                        {c.contact.currentTitle}
                                                    </div>
                                                    <div className="text-xs text-neutral-400 truncate">
                                                        {
                                                            c.contact
                                                                .currentCompany
                                                        }
                                                    </div>
                                                </td>
                                                <td
                                                    className="px-6 py-3.5 text-sm text-neutral-600"
                                                    style={colStyle(3)}
                                                >
                                                    {c.contact.location}
                                                </td>
                                                <td
                                                    className="px-6 py-3.5"
                                                    style={colStyle(4)}
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
                                    {!loading && filtered.length === 0 && (
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
                    </>
                )}
            </div>

            {selectedCandidate && (
                <div
                    className="w-1.5 cursor-col-resize hover:bg-ember/40 transition-colors bg-neutral-200 shrink-0 relative group"
                    onMouseDown={onPanelMouseDown}
                >
                    <div className="absolute inset-y-0 -left-1 -right-1" />
                </div>
            )}

            {selectedCandidate && (
                <aside
                    className="flex flex-col shrink-0 bg-white overflow-hidden"
                    style={{ width: panelWidth }}
                >
                    <div className="px-5 py-3 border-b border-neutral-200 flex items-center justify-between bg-white">
                        <div>
                            <div className="font-semibold text-neutral-800">
                                {selectedCandidate.contact.firstName}{" "}
                                {selectedCandidate.contact.lastName}
                            </div>
                            <div className="text-xs text-neutral-500">
                                {selectedCandidate.contact.currentTitle} @{" "}
                                {selectedCandidate.contact.currentCompany}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() =>
                                    toggleShortlist(
                                        selectedCandidate.contact.id,
                                    )
                                }
                                className={`text-xl transition-colors ${
                                    shortlist.has(selectedCandidate.contact.id)
                                        ? "text-amber-500"
                                        : "text-neutral-300 hover:text-amber-400"
                                }`}
                                title={
                                    shortlist.has(selectedCandidate.contact.id)
                                        ? "Remove from shortlist"
                                        : "Add to shortlist"
                                }
                            >
                                {shortlist.has(selectedCandidate.contact.id)
                                    ? "\u2605"
                                    : "\u2606"}
                            </button>
                            <a
                                href={selectedCandidate.contact.linkedinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs px-3 py-1.5 bg-neutral-900 text-white rounded-lg hover:bg-neutral-700 transition-colors font-medium"
                            >
                                Open LinkedIn ↗
                            </a>
                            <button
                                onClick={() => setSelectedCandidate(null)}
                                className="text-neutral-400 hover:text-neutral-700 text-xl leading-none"
                            >
                                &times;
                            </button>
                        </div>
                    </div>

                    <div className="px-5 py-3 border-b border-neutral-100">
                        <div className="grid grid-cols-3 gap-3 text-center">
                            {[
                                {
                                    label: "Skills",
                                    value: selectedCandidate.breakdown.skills,
                                },
                                {
                                    label: "Experience",
                                    value: selectedCandidate.breakdown
                                        .experience,
                                },
                                {
                                    label: "Location",
                                    value: selectedCandidate.breakdown.location,
                                },
                                {
                                    label: "Seniority",
                                    value: selectedCandidate.breakdown
                                        .seniority,
                                },
                                {
                                    label: "Availability",
                                    value: selectedCandidate.breakdown
                                        .availability,
                                },
                                {
                                    label: "Education",
                                    value: selectedCandidate.breakdown
                                        .education,
                                },
                            ].map((s) => (
                                <div key={s.label}>
                                    <div className="text-lg font-bold text-neutral-700">
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
                                <div className="text-neutral-700">
                                    {selectedCandidate.contact.location}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-neutral-400 uppercase tracking-wider mb-0.5">
                                    Open to Work
                                </div>
                                <div
                                    className={
                                        selectedCandidate.contact.openToWork
                                            ? "text-emerald-600 font-medium"
                                            : "text-neutral-400"
                                    }
                                >
                                    {selectedCandidate.contact.openToWork
                                        ? "Yes"
                                        : "No"}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-neutral-400 uppercase tracking-wider mb-0.5">
                                    Connections
                                </div>
                                <div className="text-neutral-700">
                                    {selectedCandidate.contact.connectionsCount.toLocaleString()}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-neutral-400 uppercase tracking-wider mb-0.5">
                                    Headline
                                </div>
                                <div className="text-neutral-700 truncate">
                                    {selectedCandidate.contact.headline}
                                </div>
                            </div>
                        </div>

                        {selectedCandidate.contact.about && (
                            <div>
                                <div className="text-xs text-neutral-400 uppercase tracking-wider mb-1">
                                    About
                                </div>
                                <p className="text-sm text-neutral-600 leading-relaxed">
                                    {selectedCandidate.contact.about}
                                </p>
                            </div>
                        )}

                        <div>
                            <div className="text-xs text-neutral-400 uppercase tracking-wider mb-2">
                                Top Skills
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {selectedCandidate.contact.topSkills.map(
                                    (skill, i) => (
                                        <span
                                            key={i}
                                            className="px-2.5 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs font-medium"
                                        >
                                            {skill}
                                        </span>
                                    ),
                                )}
                            </div>
                        </div>

                        <div>
                            <div className="text-xs text-neutral-400 uppercase tracking-wider mb-2">
                                Experience
                            </div>
                            <div className="space-y-2">
                                {selectedCandidate.contact.experienceSummary
                                    .slice(0, 8)
                                    .map((exp, i) => (
                                        <div
                                            key={i}
                                            className="flex items-start gap-2 text-sm"
                                        >
                                            <span
                                                className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${exp.isCurrent ? "bg-ember" : "bg-neutral-300"}`}
                                            />
                                            <div>
                                                <span className="font-medium text-neutral-800">
                                                    {exp.title}
                                                </span>
                                                {exp.company && (
                                                    <span className="text-neutral-500">
                                                        {" "}
                                                        @ {exp.company}
                                                    </span>
                                                )}
                                                {exp.duration && (
                                                    <span className="text-neutral-400 ml-1">
                                                        ({exp.duration})
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {selectedCandidate.contact.educationSummary.length >
                            0 && (
                            <div>
                                <div className="text-xs text-neutral-400 uppercase tracking-wider mb-2">
                                    Education
                                </div>
                                <div className="space-y-1">
                                    {selectedCandidate.contact.educationSummary.map(
                                        (edu, i) => (
                                            <p
                                                key={i}
                                                className="text-sm text-neutral-600"
                                            >
                                                {edu.degree}
                                                {edu.field
                                                    ? `, ${edu.field}`
                                                    : ""}
                                                {edu.school
                                                    ? ` — ${edu.school}`
                                                    : ""}
                                            </p>
                                        ),
                                    )}
                                </div>
                            </div>
                        )}

                        {selectedCandidate.contact.certifications.length >
                            0 && (
                            <div>
                                <div className="text-xs text-neutral-400 uppercase tracking-wider mb-2">
                                    Certifications
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {selectedCandidate.contact.certifications.map(
                                        (cert, i) => (
                                            <span
                                                key={i}
                                                className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium"
                                            >
                                                {cert}
                                            </span>
                                        ),
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </aside>
            )}

            {showSettings && (
                <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
                        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-neutral-800">
                                Scoring Weights
                            </h2>
                            <button
                                onClick={() => setShowSettings(false)}
                                className="text-neutral-400 hover:text-neutral-700 text-xl leading-none"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {(
                                Object.keys(
                                    WEIGHT_LABELS,
                                ) as (keyof ScoringWeights)[]
                            ).map((key) => (
                                <div key={key}>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-sm font-medium text-neutral-700">
                                            {WEIGHT_LABELS[key]}
                                        </label>
                                        <span className="text-sm font-mono text-neutral-500">
                                            {weights[key].toFixed(2)}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min={0}
                                        max={100}
                                        value={Math.round(weights[key] * 100)}
                                        onChange={(e) =>
                                            handleWeightChange(
                                                key,
                                                Number(e.target.value) / 100,
                                            )
                                        }
                                        className="w-full accent-ember"
                                    />
                                </div>
                            ))}
                            <div className="pt-2 border-t border-neutral-200">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-neutral-500">
                                        Total
                                    </span>
                                    <span
                                        className={`font-mono font-medium ${
                                            Math.abs(weightTotal - 1) < 0.01
                                                ? "text-emerald-600"
                                                : "text-amber-600"
                                        }`}
                                    >
                                        {weightTotal.toFixed(2)}
                                        {Math.abs(weightTotal - 1) < 0.01
                                            ? ""
                                            : " (should be 1.00)"}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between bg-neutral-50 rounded-b-xl">
                            <button
                                onClick={resetWeights}
                                className="text-sm text-neutral-600 hover:text-neutral-800 transition-colors"
                            >
                                Reset defaults
                            </button>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="px-4 py-2 text-sm border border-neutral-200 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={reRank}
                                    className="px-4 py-2 text-sm bg-neutral-900 text-white rounded-lg hover:bg-neutral-700 transition-colors font-medium"
                                >
                                    Apply & Re-rank
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
