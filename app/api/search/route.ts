import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createEmbedding } from "@/lib/embeddings";
import { urlDomain, normalizeUrl } from "@/lib/url/normalize";

const SearchSchema = z.object({
  q: z.string().min(1).max(500),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export async function GET(req: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const parsed = SearchSchema.safeParse({
    q: searchParams.get("q"),
    limit: searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });

  const limit = parsed.data.limit ?? 50;
  const q = parsed.data.q.trim();

  try {
    // Always do hybrid search: semantic + keyword with weighted scoring
    const emb = await createEmbedding(q);
    const { data, error } = await supabase.rpc("match_bookmarks_hybrid", {
      p_user_id: user.id,
      p_query_embedding: `[${emb.embedding.join(",")}]`,
      p_query_text: q,
      p_match_count: limit,
    });

    if (error) {
      // Fallback to keyword-only search if hybrid fails
      const maybeUrl = normalizeUrl(q);
      const domain = urlDomain(maybeUrl);

      const query = supabase
        .from("bookmarks")
        .select("id,url,title,description,site_name,image_url,notes,created_at")
        .eq("user_id", user.id)
        .eq("archived", false)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (domain) {
        query.ilike("url", `%${domain}%`);
      } else {
        query.or(
          `title.ilike.%${q}%,notes.ilike.%${q}%,content_text.ilike.%${q}%,description.ilike.%${q}%,url.ilike.%${q}%`
        );
      }

      const { data: fallbackData, error: fallbackError } = await query;
      if (fallbackError)
        return NextResponse.json(
          { error: fallbackError.message },
          { status: 500 }
        );
      return NextResponse.json({ results: fallbackData ?? [], fallback: true });
    }

    return NextResponse.json({ results: data ?? [] });
  } catch {
    // Fallback keyword search if embedding generation fails
    const maybeUrl = normalizeUrl(q);
    const domain = urlDomain(maybeUrl);

    const query = supabase
      .from("bookmarks")
      .select("id,url,title,description,site_name,image_url,notes,created_at")
      .eq("user_id", user.id)
      .eq("archived", false)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (domain) {
      query.ilike("url", `%${domain}%`);
    } else {
      query.or(
        `title.ilike.%${q}%,notes.ilike.%${q}%,content_text.ilike.%${q}%,description.ilike.%${q}%,url.ilike.%${q}%`
      );
    }

    const { data, error } = await query;
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ results: data ?? [], fallback: true });
  }
}
