import { createClient } from "@/lib/supabase/server";
import { createEmbedding, vectorToSqlLiteral } from "./index";

/**
 * Normalize a search query for consistent hashing
 * - Trim whitespace
 * - Convert to lowercase
 * - Collapse multiple spaces
 */
export function normalizeQuery(query: string): string {
  return query
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/**
 * Generate SHA-256 hash of a normalized query
 */
export async function hashQuery(query: string): Promise<string> {
  const normalized = normalizeQuery(query);
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Get cached embedding for a query, or generate and cache it
 */
export async function getOrCreateQueryEmbedding(
  query: string
): Promise<{ embedding: number[]; model: string; cacheHit: boolean; embedTime?: number }> {
  const supabase = await createClient();
  if (!supabase) {
    // Fallback: generate embedding if Supabase not available
    const { embedding, model } = await createEmbedding(query);
    return { embedding, model, cacheHit: false };
  }

  const queryHash = await hashQuery(query);
  const normalizedQuery = normalizeQuery(query);

  // Check cache
  const cacheStart = Date.now();
  const { data: cached, error: fetchError } = await supabase
    .from("query_embeddings_cache")
    .select("embedding, embedding_model")
    .eq("query_hash", queryHash)
    .maybeSingle(); // Use maybeSingle() instead of single() - returns null instead of error on no match
  const cacheCheckTime = Date.now() - cacheStart;

  // If there's a real error (not just "not found"), log it and include in response
  if (fetchError) {
    console.warn(`[Query Cache] Error checking cache: ${fetchError.message}`, fetchError);
    // Still continue to generate embedding even if cache check fails
  }

  if (cached && !fetchError) {
    console.log(`[Query Cache] HIT: "${normalizedQuery}" (${cacheCheckTime}ms)`);
    // Update last_used_at and use_count (best effort, don't fail on error)
    // Fire-and-forget: update cache stats in background
    void (async () => {
      try {
        await supabase.rpc("touch_query_cache", { p_query_hash: queryHash });
      } catch {
        // Ignore errors - cache touch is non-critical
      }
    })();
    
    // Convert pgvector format to array
    // Supabase JS client typically returns vectors as arrays
    let embedding: number[];
    if (Array.isArray(cached.embedding)) {
      embedding = cached.embedding;
    } else if (typeof cached.embedding === "string") {
      // Parse string format if needed (fallback)
      try {
        embedding = JSON.parse(cached.embedding);
      } catch {
        // If parsing fails, regenerate
        const { embedding: newEmb, model: newModel } = await createEmbedding(query);
        return { embedding: newEmb, model: newModel, cacheHit: false };
      }
    } else {
      // Unknown format - regenerate
      const { embedding: newEmb, model: newModel } = await createEmbedding(query);
      return { embedding: newEmb, model: newModel, cacheHit: false };
    }

    // Validate embedding is a proper array
    if (!Array.isArray(embedding) || embedding.length === 0) {
      const { embedding: newEmb, model: newModel } = await createEmbedding(query);
      return { embedding: newEmb, model: newModel, cacheHit: false };
    }

    return {
      embedding,
      model: cached.embedding_model,
      cacheHit: true,
    };
  }

  // Not in cache - generate new embedding
  console.log(`[Query Cache] MISS: "${normalizedQuery}" (cache check: ${cacheCheckTime}ms${fetchError ? `, error: ${fetchError.message}` : ""})`);
  const embedStart = Date.now();
  const { embedding, model } = await createEmbedding(query);
  const embedTime = Date.now() - embedStart;
  console.log(`[Query Cache] Generated embedding in ${embedTime}ms`);

  // Store in cache (ignore errors - caching is best effort)
  const embeddingLiteral = vectorToSqlLiteral(embedding);
  const { error: insertError } = await supabase
    .from("query_embeddings_cache")
    .insert({
      query_hash: queryHash,
      query_text: normalizedQuery,
      embedding: embeddingLiteral,
      embedding_model: model,
      created_at: new Date().toISOString(),
      last_used_at: new Date().toISOString(),
      use_count: 1,
    });

  if (insertError) {
    // Log but don't fail - caching is non-critical
    console.warn(`[Query Cache] Failed to cache: ${insertError.message}`, insertError);
  } else {
    console.log(`[Query Cache] CACHED: "${normalizedQuery}"`);
  }

  return { embedding, model, cacheHit: false, embedTime };
}
