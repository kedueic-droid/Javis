import { useCallback, useEffect, useState } from "react";
import {
  clamp,
  DEFAULT_LAYOUT,
  LAYOUT_LIMITS,
  loadLayout,
  saveLayout,
  type HudLayout,
} from "../lib/layout";

export function useHudLayout() {
  const [layout, setLayout] = useState<HudLayout>(loadLayout);

  useEffect(() => {
    saveLayout(layout);
  }, [layout]);

  const setRailWidth = useCallback((width: number) => {
    setLayout((prev) => ({
      ...prev,
      railWidth: clamp(width, LAYOUT_LIMITS.railMin, LAYOUT_LIMITS.railMax),
    }));
  }, []);

  const setEmbedRatio = useCallback((ratio: number) => {
    setLayout((prev) => ({
      ...prev,
      embedRatio: clamp(ratio, LAYOUT_LIMITS.embedMin, LAYOUT_LIMITS.embedMax),
    }));
  }, []);

  const resetLayout = useCallback(() => {
    setLayout({ ...DEFAULT_LAYOUT });
  }, []);

  return { layout, setRailWidth, setEmbedRatio, resetLayout };
}
