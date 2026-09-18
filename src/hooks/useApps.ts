import { useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_APPS, DEFAULT_SETTINGS } from "../data/defaults";
import { createId } from "../lib/cn";
import {
  createExportPayload,
  downloadJson,
  loadState,
  parseImportPayload,
  saveState,
} from "../lib/storage";
import type { AppModule, IconKey, PortalSettings } from "../types";

export function useApps() {
  const initial = useMemo(() => loadState(), []);
  const [apps, setApps] = useState<AppModule[]>(initial.apps);
  const [settings, setSettings] = useState<PortalSettings>(initial.settings);

  useEffect(() => {
    saveState(apps, settings);
  }, [apps, settings]);

  const updateApp = useCallback((id: string, patch: Partial<AppModule>) => {
    setApps((prev) => prev.map((app) => (app.id === id ? { ...app, ...patch } : app)));
  }, []);

  const addApp = useCallback(
    (input: {
      name: string;
      description: string;
      stack: string;
      url: string;
      icon: IconKey;
    }) => {
      const next: AppModule = {
        id: createId("custom"),
        name: input.name.trim() || "自訂模組",
        description: input.description.trim() || "使用者新增的啟動器。",
        stack: input.stack.trim() || "自訂",
        url: input.url.trim(),
        defaultUrl: input.url.trim(),
        icon: input.icon,
        enabled: true,
        builtin: false,
        repoHint: "自訂",
      };
      setApps((prev) => [...prev, next]);
      return next;
    },
    [],
  );

  const removeApp = useCallback((id: string) => {
    setApps((prev) => prev.filter((app) => app.id !== id || app.builtin));
  }, []);

  const resetAll = useCallback(() => {
    setApps(DEFAULT_APPS.map((app) => ({ ...app })));
    setSettings({ ...DEFAULT_SETTINGS });
  }, []);

  const exportJson = useCallback(() => {
    downloadJson("jarvis-portal.json", createExportPayload(apps, settings));
  }, [apps, settings]);

  const importJson = useCallback((raw: string) => {
    const parsed = parseImportPayload(raw);
    setApps(parsed.apps);
    setSettings(parsed.settings);
  }, []);

  return {
    apps,
    settings,
    setSettings,
    updateApp,
    addApp,
    removeApp,
    resetAll,
    exportJson,
    importJson,
  };
}
