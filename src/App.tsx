import { useCallback, useMemo, useState } from "react";
import { BootSequence } from "./components/BootSequence";
import { CommandPalette } from "./components/CommandPalette";
import { EmbedStage } from "./components/EmbedStage";
import { CornerMarks, HudDecor } from "./components/HudDecor";
import { LauncherStage } from "./components/LauncherStage";
import { SettingsPanel } from "./components/SettingsPanel";
import { SideRail } from "./components/SideRail";
import { StatusStrip } from "./components/StatusStrip";
import { ToastStack } from "./components/ToastStack";
import { TopBar } from "./components/TopBar";
import { useApps } from "./hooks/useApps";
import { useClock } from "./hooks/useClock";
import { useHotkeys } from "./hooks/useHotkeys";
import { useReducedMotion } from "./hooks/useReducedMotion";
import { playBootChime, playConfirmBlip } from "./lib/audio";
import { createId } from "./lib/cn";
import type { AppModule, Overlay, ToastMessage } from "./types";

export default function App() {
  const reducedMotion = useReducedMotion();
  const { clock, date, greeting } = useClock();
  const {
    apps,
    settings,
    setSettings,
    updateApp,
    addApp,
    removeApp,
    resetAll,
    exportJson,
    importJson,
  } = useApps();

  const [booting, setBooting] = useState(() => !settings.skipBoot && !reducedMotion);
  const [overlay, setOverlay] = useState<Overlay>("none");
  const [embedApp, setEmbedApp] = useState<AppModule | null>(null);
  const [focusAdd, setFocusAdd] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [logs, setLogs] = useState<string[]>(() => [
    `${clock}  指揮中心初始化`,
    `${clock}  目錄載入 ${apps.length} 個模組`,
  ]);

  const pushToast = useCallback((text: string, tone: ToastMessage["tone"] = "info") => {
    setToasts((prev) => [...prev.slice(-3), { id: createId("toast"), text, tone }]);
  }, []);

  const pushLog = useCallback((line: string) => {
    const stamp = new Date();
    const hh = stamp.toTimeString().slice(0, 8);
    setLogs((prev) => [`${hh}  ${line}`, ...prev].slice(0, 20));
  }, []);

  const openTab = useCallback(
    (app: AppModule) => {
      if (!app.url.trim()) {
        pushToast("請先在設定中填寫目標網址", "warn");
        setOverlay("settings");
        return;
      }
      window.open(app.url, "_blank", "noopener,noreferrer");
      pushLog(`啟動 ${app.name}`);
      pushToast(`已開啟「${app.name}」`, "ok");
      if (settings.soundEnabled) void playConfirmBlip();
      setOverlay("none");
    },
    [pushLog, pushToast, settings.soundEnabled],
  );

  const openEmbed = useCallback(
    (app: AppModule) => {
      if (!app.url.trim()) {
        pushToast("請先在設定中填寫目標網址", "warn");
        setOverlay("settings");
        return;
      }
      setEmbedApp(app);
      setOverlay("embed");
      pushLog(`內嵌 ${app.name}`);
    },
    [pushLog, pushToast],
  );

  const handleLaunch = useCallback(
    (app: AppModule) => {
      if (settings.openMode === "embed") openEmbed(app);
      else openTab(app);
    },
    [openEmbed, openTab, settings.openMode],
  );

  const closeOverlays = useCallback(() => {
    setOverlay("none");
    setEmbedApp(null);
    setFocusAdd(false);
  }, []);

  const hotkeyHandlers = useMemo(
    () => ({
      onPalette: () =>
        setOverlay((cur) => (cur === "palette" ? "none" : "palette")),
      onEscape: closeOverlays,
    }),
    [closeOverlays],
  );
  useHotkeys(hotkeyHandlers);

  const finishBoot = useCallback(() => {
    setBooting(false);
    pushLog("系統上線");
    if (settings.soundEnabled) void playBootChime();
  }, [pushLog, settings.soundEnabled]);

  return (
    <div className="hud-root flex min-h-dvh flex-col">
      <a
        href="#main-stage"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:bg-black focus:px-3 focus:py-2"
      >
        跳到主畫面
      </a>
      <HudDecor reducedMotion={reducedMotion} />
      <CornerMarks />

      {booting && <BootSequence reducedMotion={reducedMotion} onDone={finishBoot} />}

      <TopBar
        clock={clock}
        date={date}
        greetingTitle={greeting.title}
        greetingLine={greeting.line}
        onOpenPalette={() => setOverlay("palette")}
        onOpenSettings={() => setOverlay("settings")}
      />

      <div className="relative z-10 flex min-h-0 flex-1">
        <SideRail
          apps={apps}
          logs={logs}
          onSelect={handleLaunch}
          onOpenSettings={() => setOverlay("settings")}
        />
        <main id="main-stage" className="flex min-w-0 flex-1 flex-col">
          <LauncherStage
            apps={apps}
            onLaunch={handleLaunch}
            onEmbed={openEmbed}
            onConfigure={() => setOverlay("settings")}
          />
        </main>
      </div>

      <div className="relative z-10">
        <StatusStrip apps={apps} clock={clock} />
      </div>

      {overlay === "settings" && (
        <SettingsPanel
          apps={apps}
          settings={settings}
          focusAdd={focusAdd}
          onClose={closeOverlays}
          onUpdate={updateApp}
          onRemove={(id) => {
            removeApp(id);
            pushToast("已刪除自訂應用", "ok");
          }}
          onAdd={(input) => {
            const created = addApp(input);
            pushToast(`已新增「${created.name}」`, "ok");
            pushLog(`新增模組 ${created.name}`);
          }}
          onSettings={(patch) => setSettings((s) => ({ ...s, ...patch }))}
          onReset={() => {
            resetAll();
            pushToast("已重設為出廠預設", "warn");
          }}
          onExport={() => {
            exportJson();
            pushToast("已匯出設定檔", "ok");
          }}
          onImport={(raw) => {
            try {
              importJson(raw);
              pushToast("匯入完成", "ok");
            } catch (err) {
              pushToast(err instanceof Error ? err.message : "匯入失敗", "warn");
            }
          }}
        />
      )}

      {overlay === "palette" && (
        <CommandPalette
          apps={apps}
          onClose={closeOverlays}
          onLaunch={handleLaunch}
          onEmbed={openEmbed}
          onOpenSettings={() => {
            setFocusAdd(false);
            setOverlay("settings");
          }}
          onAddApp={() => {
            setFocusAdd(true);
            setOverlay("settings");
          }}
        />
      )}

      {overlay === "embed" && embedApp && (
        <EmbedStage app={embedApp} onClose={closeOverlays} onOpenTab={openTab} />
      )}

      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </div>
  );
}
