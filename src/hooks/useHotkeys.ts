import { useEffect } from "react";

export function useHotkeys(handlers: {
  onPalette: () => void;
  onEscape: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if (event.key === "Escape") {
        event.preventDefault();
        handlers.onEscape();
        return;
      }

      const isPalette =
        (event.key === "k" && (event.metaKey || event.ctrlKey)) ||
        (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey);

      if (isPalette) {
        if (event.key === "/" && typing) return;
        event.preventDefault();
        handlers.onPalette();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handlers]);
}
