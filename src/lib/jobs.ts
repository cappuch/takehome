import type { Job } from "@/types";

export async function fetchJobs(): Promise<Job[]> {
    const scraperBase =
        process.env.SCRAPER_BASE ||
        "https://misty-snow-9cc3.mikussturmanis1.workers.dev/?url=";
    const targetUrl = encodeURIComponent("https://jobs.ashbyhq.com/stackone");

    try {
        const res = await fetch(`${scraperBase}${targetUrl}`, {
            next: { revalidate: 3600 },
        });
        if (!res.ok) {
            throw new Error(`Failed to fetch jobs: ${res.status}`);
        }
        const data = await res.json();
        return data.jobs || [];
    } catch (err) {
        console.error("Error fetching jobs:", err);
        return [];
    }
}
