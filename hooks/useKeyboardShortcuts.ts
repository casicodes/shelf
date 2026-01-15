"use client";

import { useEffect, useCallback } from "react";

type ShortcutHandlers = {
  onAddMode: () => void;
};

export function useKeyboardShortcuts({
  onAddMode,
}: ShortcutHandlers) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";

      if (isCmdK) {
        e.preventDefault();
        onAddMode();
      }
    },
    [onAddMode]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
