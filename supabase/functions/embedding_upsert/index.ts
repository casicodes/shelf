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
    .select("id,user_id,url,title,description,site_name,notes")
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

  const content = [
    bookmark.title,
    bookmark.description,
    bookmark.notes,
    bookmark.site_name,
    bookmark.url,
    tagList.length ? `tags: ${tagList.join(", ")}` : null
  ]
    .filter(Boolean)
    .join("\n");

  const { embedding, model } = await createEmbedding(content);
  const embeddingLiteral = vectorToSqlLiteral(embedding);

  const upsertRes = await supabase.from("bookmark_embeddings").upsert(
    {
      bookmark_id: payload.bookmarkId,
      user_id: payload.userId,
      content_for_embedding: content,
      embedding: embeddingLiteral,
      embedding_version: model,
      updated_at: new Date().toISOString()
    },
    { onConflict: "bookmark_id" }
  );

  if (upsertRes.error) return json({ error: upsertRes.error.message }, 500);

  return json({ ok: true });
});

