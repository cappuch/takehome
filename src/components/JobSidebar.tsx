"use client";

import type { Job } from "@/types";

interface JobSidebarProps {
    jobs: Job[];
    selectedJob: Job | null;
    onSelect: (job: Job) => void;
}

export default function JobSidebar({
    jobs,
    selectedJob,
    onSelect,
}: JobSidebarProps) {
    return (
        <aside className="w-72 border-r border-neutral-200 bg-neutral-50 flex flex-col shrink-0">
            <div className="px-5 py-4 border-b border-neutral-200 bg-white">
                <h2 className="font-semibold text-neutral-800">Open Roles</h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                    {jobs.length} positions
                </p>
            </div>
            <div className="flex-1 overflow-y-auto">
                {jobs.map((job) => (
                    <button
                        key={job.id}
                        onClick={() => onSelect(job)}
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
    );
}
