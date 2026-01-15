import { createAdminClient } from "../_shared/supabaseAdmin.ts";
import { createEmbedding, vectorToSqlLiteral } from "../_shared/openai.ts";

type Payload = {
  bookmarkId: string;
  userId: string;
};

function json(resBody: unknown, status = 200) {
  return new Response(JSON.stringify(resBody), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

export default Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  const supabase = createAdminClient();
  const payload = (await req.json().catch(() => null)) as Payload | null;
  if (!payload?.bookmarkId || !payload?.userId) return json({ error: "Invalid payload" }, 400);

  const { data: bookmark, error: bookmarkErr } = await supabase
    .from("bookmarks")
    .select("id,user_id,url,title,description,site_name,notes,content_text")
    .eq("id", payload.bookmarkId)
    .single();

  if (bookmarkErr || !bookmark) return json({ error: "Bookmark not found" }, 404);
  if (bookmark.user_id !== payload.userId) return json({ error: "Forbidden" }, 403);

  const { data: tags } = await supabase
    .from("bookmark_tags")
    .select("tag")
    .eq("bookmark_id", payload.bookmarkId)
    .eq("user_id", payload.userId);

  const tagList = (tags ?? []).map((t) => t.tag).filter(Boolean);

  // Weighted input: Title + Notes (highest priority), then content_text, Description, Tags, Site name
  // URL omitted (rarely adds semantic meaning)
  // content_text provides rich semantic context but user intent (title/notes) takes precedence
  const content = [
    bookmark.title ?? "",
    bookmark.notes ?? "",
    bookmark.content_text ?? "",
    bookmark.description ?? "",
    tagList.length ? tagList.join(", ") : "",
    bookmark.site_name ?? ""
  ]
    .filter(Boolean)
    .join("\n");

  // Compute hash of semantic source to avoid unnecessary regenerations
  const semanticSource = JSON.stringify({
    title: bookmark.title,
    description: bookmark.description,
    notes: bookmark.notes,
    content_text: bookmark.content_text,
    tags: tagList.sort()
  });
  
  const encoder = new TextEncoder();
  const data = encoder.encode(semanticSource);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const semanticSourceHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  // Check if embedding already exists with same hash
  const { data: existing } = await supabase
    .from("bookmark_embeddings")
    .select("semantic_source_hash")
    .eq("bookmark_id", payload.bookmarkId)
    .single();

  // Skip regeneration if hash hasn't changed
  if (existing?.semantic_source_hash === semanticSourceHash) {
    return json({ ok: true, skipped: true, reason: "hash_unchanged" });
  }

  const { embedding, model } = await createEmbedding(content);
  const embeddingLiteral = vectorToSqlLiteral(embedding);

  const upsertRes = await supabase.from("bookmark_embeddings").upsert(
    {
      bookmark_id: payload.bookmarkId,
      user_id: payload.userId,
      content_for_embedding: content,
      embedding: embeddingLiteral,
      embedding_version: model,
      semantic_source_hash: semanticSourceHash,
      updated_at: new Date().toISOString()
    },
    { onConflict: "bookmark_id" }
  );

  if (upsertRes.error) return json({ error: upsertRes.error.message }, 500);

  return json({ ok: true });
});

