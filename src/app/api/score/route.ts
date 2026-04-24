import { NextRequest, NextResponse } from "next/server";
import { loadContacts } from "@/lib/contacts";
import { fetchJobs } from "@/lib/jobs";
import { rankCandidates } from "@/lib/scoring";
import type { Job, ScoringWeights } from "@/types";
import { DEFAULT_WEIGHTS } from "@/types";

const scoreCache = new Map<string, Record<string, unknown>>();
let jobsCache: Job[] | null = null;
let jobsCacheTime = 0;
const JOBS_CACHE_TTL = 30 * 60 * 1000;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { jobId, weights } = body;

        if (!jobId) {
            return NextResponse.json(
                { error: "Missing jobId" },
                { status: 400 },
            );
        }

        const cacheKey = weights
            ? `${jobId}_${JSON.stringify(weights)}`
            : jobId;
        if (scoreCache.has(cacheKey)) {
            return NextResponse.json(scoreCache.get(cacheKey));
        }

        const contacts = loadContacts();

        if (!jobsCache || Date.now() - jobsCacheTime > JOBS_CACHE_TTL) {
            jobsCache = await fetchJobs();
            jobsCacheTime = Date.now();
        }
        const job = jobsCache.find((j) => j.id === jobId);

        if (!job) {
            return NextResponse.json(
                { error: "Job not found" },
                { status: 404 },
            );
        }

        const scoringWeights: ScoringWeights = weights || DEFAULT_WEIGHTS;
        const scored = await rankCandidates(contacts, job, scoringWeights);

        const result = {
            job,
            candidates: scored.map((s) => ({
                contact: s.contact,
                score: s.score,
                breakdown: s.breakdown,
                confidence: s.confidence,
                matchReasons: s.matchReasons,
            })),
        };

        scoreCache.set(cacheKey, result);

        return NextResponse.json(result);
    } catch (err: unknown) {
        console.error("Scoring error:", err);
        return NextResponse.json(
            { error: (err as Error).message },
            { status: 500 },
        );
    }
}
