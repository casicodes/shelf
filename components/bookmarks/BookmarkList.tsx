"use client";

import type { Bookmark } from "@/types/bookmark";
import { BookmarkItem } from "./BookmarkItem";

type BookmarkListProps = {
  bookmarks: Bookmark[];
  refreshingId: string | null;
  onRefresh: (id: string) => void;
  onDelete: (id: string) => void;
};

export function BookmarkList({
  bookmarks,
  refreshingId,
  onRefresh,
  onDelete,
}: BookmarkListProps) {
  if (bookmarks.length === 0) {
    return (
      <div className="py-24 text-center text-sm text-neutral-500">
        No bookmarks yet. Add one above.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-neutral-100/50">
      {bookmarks.map((bookmark) => (
        <BookmarkItem
          key={bookmark.id}
          bookmark={bookmark}
          isRefreshing={refreshingId === bookmark.id}
          onRefresh={onRefresh}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
