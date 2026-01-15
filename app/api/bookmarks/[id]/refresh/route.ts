import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchMetadata } from "@/lib/metadata/fetch";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }
  const {
    data: { user }
  } = await supabase.auth.getUser();
  
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify bookmark exists and belongs to user
  const { data: bookmark, error: bookmarkErr } = await supabase
    .from("bookmarks")
    .select("id,url,user_id")
    .eq("id", id)
    .single();

  if (bookmarkErr || !bookmark) {
    return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
  }
  if (bookmark.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Skip text notes
  if (bookmark.url.startsWith("note://")) {
    return NextResponse.json({ error: "Cannot refresh metadata for text notes" }, { status: 400 });
  }

  // Fetch metadata directly
  const metadata = await fetchMetadata(bookmark.url);

  if (!metadata) {
    return NextResponse.json({ error: "Could not fetch metadata from URL" }, { status: 422 });
  }

  // Update bookmark with metadata
  const { error: updateErr } = await supabase
    .from("bookmarks")
    .update({
      title: metadata.title,
      description: metadata.description,
      site_name: metadata.siteName,
      image_url: metadata.imageUrl,
      content_text: metadata.contentText,
    })
    .eq("id", id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Return updated bookmark
  const { data: updated } = await supabase
    .from("bookmarks")
    .select("id,url,title,description,site_name,image_url,notes,created_at")
    .eq("id", id)
    .single();

  // Trigger embedding update after metadata refresh (fire-and-forget)
  const fnUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/embedding_upsert`
    : null;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (fnUrl && serviceRoleKey) {
    fetch(fnUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bookmarkId: id,
        userId: user.id,
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ bookmark: updated });
}
