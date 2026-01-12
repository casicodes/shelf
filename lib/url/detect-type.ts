/**
 * Detects the type/category of a bookmark based on its URL.
 * Returns a tag that can be used for filtering.
 */

export type BookmarkType = 
  | "x"
  | "youtube"
  | "linkedin"
  | "facebook"
  | "instagram"
  | "websites"
  | "snippets";

const SOCIAL_PATTERNS: Record<Exclude<BookmarkType, "websites" | "snippets">, RegExp[]> = {
  x: [
    /^https?:\/\/(www\.)?(twitter\.com|x\.com)\//i,
  ],
  youtube: [
    /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i,
    /^https?:\/\/(m\.)?youtube\.com\//i,
  ],
  linkedin: [
    /^https?:\/\/(www\.)?linkedin\.com\//i,
  ],
  facebook: [
    /^https?:\/\/(www\.)?(facebook\.com|fb\.com|fb\.watch)\//i,
    /^https?:\/\/(m\.)?facebook\.com\//i,
  ],
  instagram: [
    /^https?:\/\/(www\.)?instagram\.com\//i,
  ],
};

/**
 * Detects the bookmark type from a URL.
 * 
 * @param url - The URL to analyze
 * @param isTextNote - Whether this is a text snippet (note:// URL)
 * @returns The detected bookmark type
 */
export function detectBookmarkType(url: string, isTextNote: boolean = false): BookmarkType {
  if (isTextNote || url.startsWith("note://")) {
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

/**
 * Returns all available bookmark type filters.
 */
export const BOOKMARK_TYPES: BookmarkType[] = [
  "x",
  "youtube", 
  "linkedin",
  "facebook",
  "instagram",
  "websites",
  "snippets",
];
