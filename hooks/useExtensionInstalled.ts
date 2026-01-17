"use client";

import { useState, useEffect } from "react";

export function useExtensionInstalled() {
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // Check if extension marker exists (set by content script)
    const checkMarker = () => {
      const marker = (window as any).__SHELF_EXTENSION_INSTALLED;
      if (marker) {
        setIsInstalled(true);
        return true;
      }
      return false;
    };

    // Check immediately
    if (checkMarker()) {
      return;
    }

    let interval: NodeJS.Timeout | null = null;

    // Listen for custom event from extension
    const handleExtensionInstalled = () => {
      setIsInstalled(true);
      if (interval) {
        clearInterval(interval);
      }
    };

    window.addEventListener("shelfExtensionInstalled", handleExtensionInstalled);

    // Also check periodically in case extension loads after page load
    interval = setInterval(() => {
      if (checkMarker()) {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      }
    }, 500);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
      window.removeEventListener(
        "shelfExtensionInstalled",
        handleExtensionInstalled
      );
    };
  }, []);

  return { isInstalled };
}
