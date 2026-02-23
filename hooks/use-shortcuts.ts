"use client";

import { useEffect } from "react";

type Shortcut = {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  onTrigger: () => void;
};

export function useShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const match =
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          (!!shortcut.ctrl === (event.ctrlKey || event.metaKey)) &&
          (!!shortcut.shift === event.shiftKey) &&
          (!!shortcut.alt === event.altKey);

        if (match) {
          event.preventDefault();
          shortcut.onTrigger();
          return;
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcuts]);
}
