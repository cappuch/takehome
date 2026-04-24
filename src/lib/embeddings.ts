import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient(process.env.HF_TOKEN);

const embeddingCache = new Map<string, number[]>();

function sanitize(text: string): string {
    let result = "";
    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        if (code >= 0xd800 && code <= 0xdbff) {
            const next = text.charCodeAt(i + 1);
            if (next >= 0xdc00 && next <= 0xdfff) {
                result += text[i] + text[i + 1];
                i++;
            }
        } else if (code >= 0xdc00 && code <= 0xdfff) {
            continue;
        } else {
            result += text[i];
        }
    }
    return result.substring(0, 8000);
}

function cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    if (denom === 0) return 0;
    return dot / denom;
}

export async function getEmbedding(text: string): Promise<number[]> {
    const sanitized = sanitize(text);
    if (embeddingCache.has(sanitized)) {
        return embeddingCache.get(sanitized)!;
    }

    try {
        const output = await client.featureExtraction({
            model: "sentence-transformers/all-MiniLM-L6-v2",
            inputs: sanitized,
        });

        const embedding = output as number[];
        embeddingCache.set(sanitized, embedding);
        return embedding;
    } catch (err) {
        console.error("Embedding error:", err);
        return [];
    }
}

export async function getEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    const results: number[][] = new Array(texts.length);
    const uncached: { text: string; sanitized: string; index: number }[] = [];

    for (let i = 0; i < texts.length; i++) {
        const sanitized = sanitize(texts[i]);
        const cached = embeddingCache.get(sanitized);
        if (cached) {
            results[i] = cached;
        } else {
            uncached.push({ text: texts[i], sanitized, index: i });
        }
    }

    if (uncached.length === 0) return results;

    const BATCH = 10;
    for (let i = 0; i < uncached.length; i += BATCH) {
        const batch = uncached.slice(i, i + BATCH);

        try {
            const output = await client.featureExtraction({
                model: "sentence-transformers/all-MiniLM-L6-v2",
                inputs: batch.map((u) => u.sanitized),
            });

            const embeddings = output as number[][];
            for (let j = 0; j < batch.length; j++) {
                results[batch[j].index] = embeddings[j];
                embeddingCache.set(batch[j].sanitized, embeddings[j]);
            }
        } catch (err) {
            console.error(`Batch embedding error (${i / BATCH}):`, err);
            for (const u of batch) {
                results[u.index] = [];
            }
        }
    }

    return results;
}

export function similarityScore(a: number[], b: number[]): number {
    if (a.length === 0 || b.length === 0) return 50;
    const sim = cosineSimilarity(a, b);
    return Math.round(((sim + 1) / 2) * 100);
}
