"use client";

import { useState } from "react";
import type { Bookmark } from "@/types/bookmark";

type BookmarkItemProps = {
  bookmark: Bookmark;
  isRefreshing: boolean;
  onRefresh: (id: string) => void;
  onDelete: (id: string) => void;
};

function getFaviconUrl(url: string): string | null {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return null;
  }
}

export function BookmarkItem({
  bookmark,
  isRefreshing,
  onRefresh,
  onDelete,
}: BookmarkItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isTextNote = bookmark.url.startsWith("note://");
  const isLoading = bookmark.id.startsWith("temp-");
  const faviconUrl = isTextNote ? null : getFaviconUrl(bookmark.url);

  const displayText = isTextNote
    ? bookmark.notes ?? bookmark.title ?? "Note"
    : bookmark.title ?? bookmark.url;

  const showRefresh = !isTextNote && !bookmark.title && !isLoading;

  const icon = isTextNote ? (
    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs text-neutral-500">
      ✎
    </div>
  ) : isLoading ? (
    <div className="h-5 w-5 shrink-0 animate-pulse rounded-full bg-neutral-200" />
  ) : faviconUrl ? (
    <img
      src={faviconUrl}
      alt=""
      width={20}
      height={20}
      className="h-5 w-5 shrink-0 rounded-full"
    />
  ) : (
    <div className="h-5 w-5 shrink-0 rounded-full bg-neutral-200" />
  );

  const content = (
    <>
      <div className="flex min-w-0 flex-1 items-start gap-3 pr-8">
        {icon}
        <div className="min-w-0 flex-1">
          <p className={`truncate ${isLoading ? "shimmer" : ""}`}>
            {displayText}
          </p>
          {!isTextNote && bookmark.title && (
            <p className="truncate text-neutral-400">{bookmark.url}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {showRefresh && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRefresh(bookmark.id);
            }}
            disabled={isRefreshing}
            className="rounded px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 disabled:opacity-50"
          >
            {isRefreshing ? "..." : "↻"}
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(bookmark.id);
          }}
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-500 active:scale-[0.97] ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
          title="Delete bookmark"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
        </button>
      </div>
    </>
  );

  if (isTextNote) {
    return (
      <li
        className="hover:bg-neutral-100/50"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center justify-between px-2 py-4 text-neutral-800">
          {content}
        </div>
      </li>
    );
  }

  return (
    <li
      className="hover:bg-neutral-100/50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <a
        className={`flex items-center justify-between px-2 py-4 text-neutral-800 hover:text-neutral-950 ${
          isLoading ? "text-base" : "text-sm"
        }`}
        href={bookmark.url}
        target="_blank"
        rel="noreferrer"
      >
        {content}
      </a>
    </li>
  );
}
