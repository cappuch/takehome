export default {
    async fetch(request) {
        const url = new URL(request.url);
        const target = url.searchParams.get("url");

        if (!target) {
            return new Response(
                JSON.stringify({ error: "Missing url param" }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        try {
            const res = await fetch(target, {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (compatible; VulturBot/1.0; +https://vultur.ai)",
                },
            });

            const html = await res.text();

            const match = html.match(/window\.__appData\s*=\s*(\{[\s\S]*?\});/);

            if (!match) {
                return new Response(
                    JSON.stringify({ error: "No app data found" }),
                    {
                        status: 500,
                        headers: { "Content-Type": "application/json" },
                    },
                );
            }

            const data = JSON.parse(match[1]);

            const jobs =
                data?.jobBoard?.jobPostings?.map((job) => {
                    const locationRaw = job.locationName || "";
                    const compRaw = job.compensationTierSummary || "";

                    const isRemote = locationRaw
                        .toLowerCase()
                        .includes("remote");
                    const hasEquity = compRaw.toLowerCase().includes("equity");

                    let salaryMin = null;
                    let salaryMax = null;

                    const salaryMatch = compRaw.match(
                        /\$([\d,.]+)K?\s*–\s*\$([\d,.]+)K?/,
                    );

                    if (salaryMatch) {
                        salaryMin = parseSalary(salaryMatch[1]);
                        salaryMax = parseSalary(salaryMatch[2]);
                    }

                    let region = null;
                    const loc = locationRaw.toLowerCase();

                    // only hiring for these so this is more of a "expand later" thing
                    if (loc.includes("london")) region = "UK";
                    else if (loc.includes("san francisco")) region = "US-CA";
                    else if (loc.includes("india")) region = "IN";
                    else if (loc.includes("pt")) region = "US-PT";

                    return {
                        id: job.id,
                        title: job.title,
                        location: locationRaw,
                        team: job.teamName,
                        workplaceType: job.workplaceType,
                        compensation: compRaw || null,

                        salaryMin,
                        salaryMax,

                        isRemote,
                        hasEquity,
                        region,
                    };
                }) ?? [];

            const enriched = await Promise.all(
                jobs.map(async (job) => {
                    // skip LLM if parsing worked well enough, which it probably didn't to be honest.
                    if (
                        job.region &&
                        job.hasEquity !== undefined &&
                        job.salaryMin !== null
                    ) {
                        return job;
                    }

                    try {
                        const llmRes = await fetch(
                            "https://chatjimmy.ai/api/chat",
                            {
                                // this will almost always work
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    "User-Agent": "Mozilla/5.0",
                                },
                                body: JSON.stringify({
                                    messages: [
                                        {
                                            role: "user",
                                            content:
                                                `Extract JSON only:\n` +
                                                `location: "${job.location}"\n` +
                                                `compensation: "${job.compensation}"\n\n` +
                                                `Return:\n` +
                                                `{"isRemote":boolean,"region":string|null,"hasEquity":boolean,"salaryMin":number|null,"salaryMax":number|null}`,
                                        },
                                    ],
                                    chatOptions: {
                                        selectedModel: "llama3.1-8B",
                                        topK: 1,
                                    },
                                }),
                            },
                        );

                        const llm = await llmRes.json();

                        let parsed = {};
                        try {
                            parsed = JSON.parse(llm.message?.content || "{}");
                        } catch {
                            parsed = {};
                        }

                        return {
                            ...job,
                            ...parsed,
                        };
                    } catch {
                        return job;
                    }
                }),
            );

            return new Response(
                JSON.stringify({
                    jobs: enriched,
                    fetchedAt: new Date().toISOString(),
                }),
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                },
            );
        } catch (err) {
            return new Response(
                JSON.stringify({
                    error: "Failed to fetch or parse",
                    details: err.message,
                }),
                {
                    status: 500,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }
    },
};

// small helper
function parseSalary(val) {
    if (!val) return null;
    const num = parseFloat(val.replace(/,/g, ""));
    return isNaN(num) ? null : num * 1000;
}
