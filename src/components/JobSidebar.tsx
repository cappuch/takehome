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
        <aside className="w-72 border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex flex-col shrink-0">
            <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                <h2 className="font-semibold text-neutral-800 dark:text-neutral-100">
                    Open Roles
                </h2>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                    {jobs.length} positions
                </p>
            </div>
            <div className="flex-1 overflow-y-auto">
                {jobs.map((job) => (
                    <button
                        key={job.id}
                        onClick={() => onSelect(job)}
                        className={`w-full text-left px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800 transition-colors hover:bg-white dark:hover:bg-neutral-800 ${
                            selectedJob?.id === job.id
                                ? "bg-white dark:bg-neutral-800 border-l-2 border-l-ember"
                                : ""
                        }`}
                    >
                        <div className="font-medium text-sm text-neutral-800 dark:text-neutral-200 truncate">
                            {job.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            {job.team && (
                                <span className="text-xs text-neutral-400 dark:text-neutral-500 truncate">
                                    {job.team}
                                </span>
                            )}
                            {job.isRemote && (
                                <span className="text-xs px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded font-medium">
                                    Remote
                                </span>
                            )}
                        </div>
                        {job.location && (
                            <div className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5 truncate">
                                {job.location}
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </aside>
    );
}
