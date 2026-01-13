"use client";

import { FILTER_TAGS, type FilterTag } from "@/types/bookmark";

type FilterTagsProps = {
  activeFilter: FilterTag | null;
  onFilterChange: (filter: FilterTag | null) => void;
};

export function FilterTags({ activeFilter, onFilterChange }: FilterTagsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTER_TAGS.map((tag) => (
        <button
          key={tag.id}
          type="button"
          onClick={() =>
            onFilterChange(activeFilter === tag.id ? null : tag.id)
          }
          className={`rounded-lg  ring-1 ring-neutral-200 shadow-sm px-3 py-1.5 text-sm transition-all active:scale-[0.97] ${
            activeFilter === tag.id
              ? "text-white bg-neutral-800 ring-neutral-800"
              : "bg-white text-neutral-800 hover:ring-neutral-800"
          }`}
        >
          {tag.label}
        </button>
      ))}
    </div>
  );
}
