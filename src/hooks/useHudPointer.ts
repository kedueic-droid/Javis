import { useEffect, type RefObject } from "react";

/** Drive HUD parallax via CSS variables without React re-renders. */
export function useHudPointer(
  rootRef: RefObject<HTMLElement | null>,
  reducedMotion: boolean,
) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    root.style.setProperty("--hud-px", "0");
    root.style.setProperty("--hud-py", "0");

    if (reducedMotion) return;

    let raf = 0;
    let nextX = 0;
    let nextY = 0;

    const flush = () => {
      root.style.setProperty("--hud-px", nextX.toFixed(4));
      root.style.setProperty("--hud-py", nextY.toFixed(4));
      raf = 0;
    };

    const onMove = (event: PointerEvent) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      nextX = (event.clientX / w) * 2 - 1;
      nextY = (event.clientY / h) * 2 - 1;
      if (!raf) raf = requestAnimationFrame(flush);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reducedMotion, rootRef]);
}
