import BookmarksClient from "@/components/BookmarksClient";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("bookmarks")
    .select(`
      id,
      url,
      title,
      description,
      site_name,
      image_url,
      notes,
      created_at,
      bookmark_tags (tag)
    `)
    .eq("archived", false)
    .order("created_at", { ascending: false })
    .limit(200);

  // Transform bookmark_tags to flat tags array
  const bookmarks = (data ?? []).map((b: any) => ({
    ...b,
    tags: b.bookmark_tags?.map((t: any) => t.tag) ?? [],
    bookmark_tags: undefined,
  }));

  return <BookmarksClient initial={bookmarks} />;
}

