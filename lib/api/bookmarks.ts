import type { Bookmark } from "@/types/bookmark";

export async function fetchBookmarks(): Promise<Bookmark[]> {
  const res = await fetch("/api/bookmarks", { method: "GET" });
  if (!res.ok) return [];
  const json = await res.json();
  return json.bookmarks ?? [];
}

export async function createBookmark(url: string): Promise<{ bookmark?: Bookmark; error?: string }> {
  const res = await fetch("/api/bookmarks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const json = await res.json().catch(() => ({}));
  
  if (!res.ok) {
    return { error: json?.error ?? "Failed to save" };
  }
  return { bookmark: json.bookmark };
}

export async function refreshBookmarkMetadata(id: string): Promise<{ bookmark?: Bookmark; error?: string }> {
  const res = await fetch(`/api/bookmarks/${id}/refresh`, {
    method: "POST",
  });
  const json = await res.json().catch(() => ({}));
  
  if (!res.ok) {
    return { error: json?.error ?? "Failed to refresh" };
  }
  return { bookmark: json.bookmark };
}

export async function searchBookmarks(
  query: string,
  signal?: AbortSignal
): Promise<Bookmark[]> {
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
    signal,
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.results ?? [];
}

export async function deleteBookmark(id: string): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`/api/bookmarks/${id}`, {
    method: "DELETE",
  });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    return { success: false, error: json?.error ?? "Failed to delete" };
  }
  return { success: true };
}

export async function logout(): Promise<void> {
  await fetch("/api/logout", { method: "POST" });
}
