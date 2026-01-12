/**
 * Backfill script to add auto-tags to existing bookmarks.
 * 
 * Run with: npx tsx scripts/backfill-tags.ts
 * 
 * Requires environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";

type BookmarkType =
  | "x"
  | "youtube"
  | "linkedin"
  | "facebook"
  | "instagram"
  | "websites"
  | "snippets";

const SOCIAL_PATTERNS: Record<
  Exclude<BookmarkType, "websites" | "snippets">,
  RegExp[]
> = {
  x: [/^https?:\/\/(www\.)?(twitter\.com|x\.com)\//i],
  youtube: [
    /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i,
    /^https?:\/\/(m\.)?youtube\.com\//i,
  ],
  linkedin: [/^https?:\/\/(www\.)?linkedin\.com\//i],
  facebook: [
    /^https?:\/\/(www\.)?(facebook\.com|fb\.com|fb\.watch)\//i,
    /^https?:\/\/(m\.)?facebook\.com\//i,
  ],
  instagram: [/^https?:\/\/(www\.)?instagram\.com\//i],
};

function detectBookmarkType(url: string): BookmarkType {
  if (url.startsWith("note://")) {
    return "snippets";
  }

  for (const [type, patterns] of Object.entries(SOCIAL_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(url)) {
        return type as BookmarkType;
      }
    }
  }

  return "websites";
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing required environment variables:");
    console.error("  - NEXT_PUBLIC_SUPABASE_URL");
    console.error("  - SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  console.log("Fetching all bookmarks...");

  const { data: bookmarks, error: fetchError } = await supabase
    .from("bookmarks")
    .select("id, user_id, url");

  if (fetchError) {
    console.error("Failed to fetch bookmarks:", fetchError.message);
    process.exit(1);
  }

  if (!bookmarks || bookmarks.length === 0) {
    console.log("No bookmarks found.");
    return;
  }

  console.log(`Found ${bookmarks.length} bookmarks. Processing...`);

  // Fetch existing tags to avoid duplicates
  const { data: existingTags } = await supabase
    .from("bookmark_tags")
    .select("bookmark_id, tag");

  const existingTagSet = new Set(
    (existingTags ?? []).map((t) => `${t.bookmark_id}:${t.tag}`)
  );

  const tagsToInsert: Array<{
    bookmark_id: string;
    user_id: string;
    tag: string;
  }> = [];

  for (const bookmark of bookmarks) {
    const tag = detectBookmarkType(bookmark.url);
    const key = `${bookmark.id}:${tag}`;

    if (!existingTagSet.has(key)) {
      tagsToInsert.push({
        bookmark_id: bookmark.id,
        user_id: bookmark.user_id,
        tag,
      });
    }
  }

  if (tagsToInsert.length === 0) {
    console.log("All bookmarks already have tags. Nothing to do.");
    return;
  }

  console.log(`Inserting ${tagsToInsert.length} new tags...`);

  // Insert in batches of 100
  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < tagsToInsert.length; i += batchSize) {
    const batch = tagsToInsert.slice(i, i + batchSize);
    const { error: insertError } = await supabase
      .from("bookmark_tags")
      .insert(batch);

    if (insertError) {
      console.error(`Batch insert failed:`, insertError.message);
    } else {
      inserted += batch.length;
      console.log(`  Inserted ${inserted}/${tagsToInsert.length}`);
    }
  }

  console.log("Done!");

  // Summary
  const summary: Record<string, number> = {};
  for (const t of tagsToInsert) {
    summary[t.tag] = (summary[t.tag] ?? 0) + 1;
  }
  console.log("\nTag breakdown:");
  for (const [tag, count] of Object.entries(summary).sort(
    (a, b) => b[1] - a[1]
  )) {
    console.log(`  ${tag}: ${count}`);
  }
}

main().catch(console.error);
