"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Bookmark } from "@/types/bookmark";
import { fetchBookmarks, createBookmark, refreshBookmarkMetadata, deleteBookmark as deleteBookmarkApi } from "@/lib/api/bookmarks";

export function useBookmarks(initial: Bookmark[]) {
  const [items, setItems] = useState<Bookmark[]>(initial);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const pendingDeletes = useRef<Map<string, { bookmark: Bookmark; index: number }>>(new Map());

  // Refresh bookmarks on mount
  useEffect(() => {
    fetchBookmarks()
      .then(setItems)
      .catch(() => {});
  }, []);

  const addBookmark = useCallback(async (url: string) => {
    const tempId = `temp-${Date.now()}`;
    const optimistic: Bookmark = {
      id: tempId,
      url,
      title: null,
      description: null,
      site_name: null,
      image_url: null,
      notes: null,
      created_at: new Date().toISOString(),
    };

    // Optimistic update
    setItems((prev) => [optimistic, ...prev]);

    const { bookmark, error } = await createBookmark(url);

    if (error) {
      setItems((prev) => prev.filter((b) => b.id !== tempId));
      return { error };
    }

    if (bookmark) {
      setItems((prev) =>
        prev.map((b) => (b.id === tempId ? { ...optimistic, ...bookmark } : b))
      );
    }

    return { bookmark };
  }, []);

  const refreshMetadata = useCallback(async (id: string) => {
    setRefreshingId(id);
    
    const { bookmark, error } = await refreshBookmarkMetadata(id);
    
    if (bookmark) {
      setItems((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ...bookmark } : b))
      );
    }
    
    setRefreshingId(null);
    return { bookmark, error };
  }, []);

  // Remove from UI but don't delete from DB yet
  const deleteBookmark = useCallback((id: string): { deletedBookmark: Bookmark | null } => {
    let deletedBookmark: Bookmark | null = null;
    let deletedIndex = 0;

    setItems((prev) => {
      const index = prev.findIndex((b) => b.id === id);
      if (index !== -1) {
        deletedBookmark = prev[index];
        deletedIndex = index;
      }
      return prev.filter((b) => b.id !== id);
    });

    if (deletedBookmark) {
      pendingDeletes.current.set(id, { bookmark: deletedBookmark, index: deletedIndex });
    }

    return { deletedBookmark };
  }, []);

  // Restore a soft-deleted bookmark
  const undoDelete = useCallback((id: string) => {
    const pending = pendingDeletes.current.get(id);
    if (!pending) return;

    pendingDeletes.current.delete(id);

    setItems((prev) => {
      const newItems = [...prev];
      // Insert at original position or start if index is out of bounds
      const insertIndex = Math.min(pending.index, newItems.length);
      newItems.splice(insertIndex, 0, pending.bookmark);
      return newItems;
    });
  }, []);

  // Actually delete from database
  const confirmDelete = useCallback(async (id: string) => {
    pendingDeletes.current.delete(id);
    
    const { success, error } = await deleteBookmarkApi(id);

    if (!success) {
      // Refetch on failure
      const bookmarks = await fetchBookmarks();
      setItems(bookmarks);
      return { error };
    }

    return { success: true };
  }, []);

  return {
    items,
    refreshingId,
    addBookmark,
    refreshMetadata,
    deleteBookmark,
    undoDelete,
    confirmDelete,
  };
}
