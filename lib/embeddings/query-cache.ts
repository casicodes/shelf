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
): Promise<{ embedding: number[]; model: string }> {
  const supabase = await createClient();
  if (!supabase) {
    // Fallback: generate embedding if Supabase not available
    return createEmbedding(query);
  }

  const queryHash = await hashQuery(query);
  const normalizedQuery = normalizeQuery(query);

  // Check cache
  const { data: cached, error: fetchError } = await supabase
    .from("query_embeddings_cache")
    .select("embedding, embedding_model")
    .eq("query_hash", queryHash)
    .single();

  if (cached && !fetchError) {
    // Update last_used_at and use_count (best effort, don't fail on error)
    supabase.rpc("touch_query_cache", { p_query_hash: queryHash }).catch(() => {
      // Ignore errors - cache touch is non-critical
    });
    
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
        return createEmbedding(query);
      }
    } else {
      // Unknown format - regenerate
      return createEmbedding(query);
    }

    // Validate embedding is a proper array
    if (!Array.isArray(embedding) || embedding.length === 0) {
      return createEmbedding(query);
    }

    return {
      embedding,
      model: cached.embedding_model,
    };
  }

  // Not in cache - generate new embedding
  const { embedding, model } = await createEmbedding(query);

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
    console.warn("Failed to cache query embedding:", insertError.message);
  }

  return { embedding, model };
}
