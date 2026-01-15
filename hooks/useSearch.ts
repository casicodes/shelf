"use client";

import { useState, useEffect } from "react";
import type { Bookmark } from "@/types/bookmark";
import { searchBookmarks } from "@/lib/api/bookmarks";

const DEBOUNCE_MS = 400;

export function useSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Bookmark[] | null>(null);

  useEffect(() => {
    const term = query.trim();
    
    if (!term) {
      setResults(null);
      return;
    }

    const controller = new AbortController();
    
    const timeout = setTimeout(() => {
      searchBookmarks(term, controller.signal)
        .then(setResults)
        .catch(() => {});
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const clearSearch = () => {
    setQuery("");
    setResults(null);
  };

  return {
    query,
    setQuery,
    results,
    clearSearch,
  };
}
