import { DEFAULT_APPS, DEFAULT_SETTINGS, STORAGE_KEY, STORAGE_VERSION } from "../data/defaults";
import type { AppModule, IconKey, PortalExport, PortalSettings } from "../types";

export const HUD_PREF_REV = 1;

interface StoredState {
  version: number;
  hudPrefRev?: number;
  apps: AppModule[];
  settings: PortalSettings;
}

const ICON_KEYS: IconKey[] = [
  "dashboard",
  "weekly",
  "island",
  "lab",
  "package",
  "hex",
  "radar",
  "shield",
];

function isIconKey(value: unknown): value is IconKey {
  return typeof value === "string" && ICON_KEYS.includes(value as IconKey);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function normalizeApp(raw: unknown, fallback?: AppModule): AppModule | null {
  if (!raw || typeof raw !== "object") return fallback ?? null;
  const item = raw as Record<string, unknown>;
  const id = asString(item.id, fallback?.id ?? crypto.randomUUID());
  if (!id) return fallback ?? null;

  return {
    id,
    name: asString(item.name, fallback?.name ?? "未命名模組"),
    description: asString(item.description, fallback?.description ?? ""),
    stack: asString(item.stack, fallback?.stack ?? "自訂"),
    url: asString(item.url, fallback?.url ?? ""),
    defaultUrl: asString(item.defaultUrl, fallback?.defaultUrl ?? ""),
    icon: isIconKey(item.icon) ? item.icon : (fallback?.icon ?? "hex"),
    enabled: asBoolean(item.enabled, fallback?.enabled ?? true),
    builtin: asBoolean(item.builtin, fallback?.builtin ?? false),
    repoHint: asString(item.repoHint, fallback?.repoHint ?? ""),
  };
}

export function mergeApps(
  stored: unknown,
  options: { forceDefaultUrls?: boolean } = {},
): AppModule[] {
  const list = Array.isArray(stored) ? stored : [];
  const byId = new Map<string, unknown>();
  for (const item of list) {
    if (item && typeof item === "object" && "id" in item) {
      byId.set(String((item as { id: unknown }).id), item);
    }
  }

  const merged = DEFAULT_APPS.map((def) => {
    const existing = byId.get(def.id);
    byId.delete(def.id);
    const app = normalizeApp(existing, def) ?? def;
    if (options.forceDefaultUrls && def.builtin) {
      return { ...app, url: def.url, defaultUrl: def.defaultUrl };
    }
    return app;
  });

  for (const leftover of byId.values()) {
    const custom = normalizeApp(leftover);
    if (custom) merged.push({ ...custom, builtin: false });
  }

  return merged;
}

export function loadState(): { apps: AppModule[]; settings: PortalSettings } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        apps: DEFAULT_APPS.map((app) => ({ ...app })),
        settings: { ...DEFAULT_SETTINGS },
      };
    }
    const parsed = JSON.parse(raw) as StoredState;
    const hudPrefRev = typeof parsed.hudPrefRev === "number" ? parsed.hudPrefRev : 0;
    const storedMode =
      parsed.settings?.openMode === "embed" || parsed.settings?.openMode === "tab"
        ? parsed.settings.openMode
        : DEFAULT_SETTINGS.openMode;
    const settings: PortalSettings = {
      skipBoot: asBoolean(parsed.settings?.skipBoot, DEFAULT_SETTINGS.skipBoot),
      soundEnabled: asBoolean(
        parsed.settings?.soundEnabled,
        DEFAULT_SETTINGS.soundEnabled,
      ),
      openMode: hudPrefRev < HUD_PREF_REV ? "embed" : storedMode,
    };
    const forceDefaultUrls =
      typeof parsed.version !== "number" || parsed.version < STORAGE_VERSION;
    return { apps: mergeApps(parsed.apps, { forceDefaultUrls }), settings };
  } catch {
    return {
      apps: DEFAULT_APPS.map((app) => ({ ...app })),
      settings: { ...DEFAULT_SETTINGS },
    };
  }
}

export function saveState(apps: AppModule[], settings: PortalSettings): void {
  const payload: StoredState = {
    version: STORAGE_VERSION,
    hudPrefRev: HUD_PREF_REV,
    apps,
    settings,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function createExportPayload(
  apps: AppModule[],
  settings: PortalSettings,
): PortalExport {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    apps,
    settings,
  };
}

export function parseImportPayload(raw: string): {
  apps: AppModule[];
  settings: PortalSettings;
} {
  const parsed = JSON.parse(raw) as PortalExport | StoredState;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("檔案格式無效");
  }
  const settings: PortalSettings = {
    skipBoot: asBoolean(
      (parsed as PortalExport).settings?.skipBoot,
      DEFAULT_SETTINGS.skipBoot,
    ),
    soundEnabled: asBoolean(
      (parsed as PortalExport).settings?.soundEnabled,
      DEFAULT_SETTINGS.soundEnabled,
    ),
    openMode:
      (parsed as PortalExport).settings?.openMode === "tab"
        ? "tab"
        : DEFAULT_SETTINGS.openMode,
  };
  const apps = mergeApps((parsed as PortalExport).apps);
  if (apps.length === 0) throw new Error("匯入資料不含任何應用");
  return { apps, settings };
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
