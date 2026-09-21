export const LAYOUT_STORAGE_KEY = "jarvis.hud.layout.v1";

export interface HudLayout {
  railWidth: number;
  embedRatio: number;
}

export const DEFAULT_LAYOUT: HudLayout = {
  railWidth: 256,
  embedRatio: 0.6,
};

export const LAYOUT_LIMITS = {
  railMin: 196,
  railMax: 380,
  embedMin: 0.34,
  embedMax: 0.8,
  launcherMinPx: 280,
  embedMinPxX: 320,
  embedMinPxY: 200,
  launcherMinPxY: 148,
} as const;

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function loadLayout(): HudLayout {
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_LAYOUT };
    const parsed = JSON.parse(raw) as Partial<HudLayout>;
    return {
      railWidth: clamp(
        typeof parsed.railWidth === "number" ? parsed.railWidth : DEFAULT_LAYOUT.railWidth,
        LAYOUT_LIMITS.railMin,
        LAYOUT_LIMITS.railMax,
      ),
      embedRatio: clamp(
        typeof parsed.embedRatio === "number" ? parsed.embedRatio : DEFAULT_LAYOUT.embedRatio,
        LAYOUT_LIMITS.embedMin,
        LAYOUT_LIMITS.embedMax,
      ),
    };
  } catch {
    return { ...DEFAULT_LAYOUT };
  }
}

export function saveLayout(layout: HudLayout): void {
  localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
}
