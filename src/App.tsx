import { useCallback, useMemo, useRef, useState } from "react";
import { BootSequence } from "./components/BootSequence";
import { CommandPalette } from "./components/CommandPalette";
import { EmbedStage } from "./components/EmbedStage";
import { CornerMarks, HudDecor, HudPostFx } from "./components/HudDecor";
import { LauncherStage } from "./components/LauncherStage";
import { ResizeHandle } from "./components/ResizeHandle";
import { SettingsPanel } from "./components/SettingsPanel";
import { SideRail } from "./components/SideRail";
import { StatusStrip } from "./components/StatusStrip";
import { ToastStack } from "./components/ToastStack";
import { TopBar } from "./components/TopBar";
import { useApps } from "./hooks/useApps";
import { useClock } from "./hooks/useClock";
import { useHotkeys } from "./hooks/useHotkeys";
import { useHudLayout } from "./hooks/useHudLayout";
import { useMediaQuery } from "./hooks/useMediaQuery";
import { useReducedMotion } from "./hooks/useReducedMotion";
import { playBootChime, playConfirmBlip } from "./lib/audio";
import { createId } from "./lib/cn";
import { clamp, LAYOUT_LIMITS } from "./lib/layout";
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
  const { layout, setRailWidth, setEmbedRatio } = useHudLayout();
  const isXl = useMediaQuery("(min-width: 1280px)");
  const isWide = useMediaQuery("(min-width: 1024px)");

  const rootRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  const [booting, setBooting] = useState(() => !settings.skipBoot && !reducedMotion);
  const [overlay, setOverlay] = useState<Overlay>("none");
  const [embedApp, setEmbedApp] = useState<AppModule | null>(null);
  const [focusAdd, setFocusAdd] = useState(false);
  const [dragging, setDragging] = useState(false);
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
      pushLog(`外部開啟 ${app.name}`);
      pushToast(`已於新分頁開啟「${app.name}」`, "ok");
      if (settings.soundEnabled) void playConfirmBlip();
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
      setOverlay("none");
      setFocusAdd(false);
      pushLog(`投影 ${app.name}`);
      pushToast(`已於指揮中心載入「${app.name}」`, "ok");
      if (settings.soundEnabled) void playConfirmBlip();
    },
    [pushLog, pushToast, settings.soundEnabled],
  );

  const handleLaunch = useCallback(
    (app: AppModule) => {
      if (settings.openMode === "tab") openTab(app);
      else openEmbed(app);
    },
    [openEmbed, openTab, settings.openMode],
  );

  const closeOverlay = useCallback(() => {
    setOverlay("none");
    setFocusAdd(false);
  }, []);

  const closeEmbed = useCallback(() => {
    setEmbedApp(null);
  }, []);

  const onEscape = useCallback(() => {
    if (overlay !== "none") {
      closeOverlay();
      return;
    }
    if (embedApp) closeEmbed();
  }, [closeEmbed, closeOverlay, embedApp, overlay]);

  const hotkeyHandlers = useMemo(
    () => ({
      onPalette: () =>
        setOverlay((cur) => (cur === "palette" ? "none" : "palette")),
      onEscape,
    }),
    [onEscape],
  );
  useHotkeys(hotkeyHandlers);

  const finishBoot = useCallback(() => {
    setBooting(false);
    pushLog("系統上線");
    if (settings.soundEnabled) void playBootChime();
  }, [pushLog, settings.soundEnabled]);

  const resizeRail = useCallback(
    (clientX: number) => {
      const rect = workspaceRef.current?.getBoundingClientRect();
      if (!rect) return;
      setRailWidth(clientX - rect.left);
    },
    [setRailWidth],
  );

  const resizeEmbed = useCallback(
    (clientX: number, clientY: number) => {
      const rect = mainRef.current?.getBoundingClientRect();
      if (!rect) return;
      if (isWide) {
        const maxPx = rect.width - LAYOUT_LIMITS.launcherMinPx - 12;
        const embedPx = clamp(rect.right - clientX, LAYOUT_LIMITS.embedMinPxX, Math.max(LAYOUT_LIMITS.embedMinPxX, maxPx));
        setEmbedRatio(embedPx / rect.width);
      } else {
        const maxPx = rect.height - LAYOUT_LIMITS.launcherMinPxY - 12;
        const embedPx = clamp(rect.bottom - clientY, LAYOUT_LIMITS.embedMinPxY, Math.max(LAYOUT_LIMITS.embedMinPxY, maxPx));
        setEmbedRatio(embedPx / rect.height);
      }
    },
    [isWide, setEmbedRatio],
  );

  const nudgeRail = useCallback(
    (delta: number) => setRailWidth(layout.railWidth + delta),
    [layout.railWidth, setRailWidth],
  );

  const nudgeEmbed = useCallback(
    (delta: number) => {
      const rect = mainRef.current?.getBoundingClientRect();
      const span = isWide ? rect?.width ?? 800 : rect?.height ?? 600;
      setEmbedRatio(layout.embedRatio - delta / span);
    },
    [isWide, layout.embedRatio, setEmbedRatio],
  );

  const embedOpen = Boolean(embedApp);

  return (
    <div ref={rootRef} className="hud-root flex h-dvh flex-col overflow-hidden">
      <a
        href="#main-stage"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:bg-black focus:px-3 focus:py-2"
      >
        跳到主畫面
      </a>

      {booting && <BootSequence reducedMotion={reducedMotion} onDone={finishBoot} />}

      <div className="hud-stage min-h-0 flex-1">
        <div className="hud-world">
          <HudDecor reducedMotion={reducedMotion} />
          <CornerMarks />

          <div className="hud-ui relative z-10 flex h-full min-h-0 flex-col">
            <div className="hud-obj hud-obj-top shrink-0">
              <TopBar
                clock={clock}
                date={date}
                greetingTitle={greeting.title}
                greetingLine={greeting.line}
                onOpenPalette={() => setOverlay("palette")}
                onOpenSettings={() => setOverlay("settings")}
              />
            </div>

            <div ref={workspaceRef} className="hud-workspace flex min-h-0 min-w-0 flex-1">
              {isXl && (
                <>
                  <div className="hud-obj hud-obj-rail flex min-h-0 shrink-0 self-stretch" style={{ width: layout.railWidth }}>
                    <SideRail
                      apps={apps}
                      logs={logs}
                      activeId={embedApp?.id}
                      onSelect={handleLaunch}
                      onOpenSettings={() => setOverlay("settings")}
                    />
                  </div>
                  <ResizeHandle
                    orientation="vertical"
                    label="拖曳調整模組欄寬度"
                    onDragStart={() => setDragging(true)}
                    onDragEnd={() => setDragging(false)}
                    onDrag={(x) => resizeRail(x)}
                    onNudge={nudgeRail}
                  />
                </>
              )}

              <main
                ref={mainRef}
                id="main-stage"
                className={`hud-main flex min-h-0 min-w-0 flex-1 ${embedOpen && !isWide ? "flex-col" : ""}`}
              >
                <div
                  className="hud-obj hud-obj-launcher min-h-0 min-w-0"
                  style={
                    embedOpen
                      ? {
                          flex: `${1 - layout.embedRatio} 1 ${
                            isWide ? LAYOUT_LIMITS.launcherMinPx : LAYOUT_LIMITS.launcherMinPxY
                          }px`,
                        }
                      : { flex: "1 1 auto" }
                  }
                >
                  <LauncherStage
                    apps={apps}
                    dense={embedOpen}
                    activeId={embedApp?.id}
                    reducedMotion={reducedMotion}
                    onLaunch={handleLaunch}
                    onConfigure={() => setOverlay("settings")}
                  />
                </div>

                {embedApp && (
                  <>
                    <ResizeHandle
                      orientation={isWide ? "vertical" : "horizontal"}
                      label={isWide ? "拖曳調整內嵌舞台寬度" : "拖曳調整內嵌舞台高度"}
                      onDragStart={() => setDragging(true)}
                      onDragEnd={() => setDragging(false)}
                      onDrag={resizeEmbed}
                      onNudge={nudgeEmbed}
                    />
                    <div
                      className="hud-obj hud-obj-embed flex min-h-0 min-w-0"
                      style={{
                        flex: `${layout.embedRatio} 1 ${
                          isWide ? LAYOUT_LIMITS.embedMinPxX : LAYOUT_LIMITS.embedMinPxY
                        }px`,
                      }}
                    >
                      <EmbedStage
                        app={embedApp}
                        shieldPointer={dragging}
                        onClose={closeEmbed}
                        onOpenTab={openTab}
                      />
                    </div>
                  </>
                )}
              </main>
            </div>

            <div className="hud-obj hud-obj-status shrink-0">
              <StatusStrip apps={apps} clock={clock} />
            </div>
          </div>
        </div>
        <HudPostFx reducedMotion={reducedMotion} />
      </div>

      {overlay === "settings" && (
        <SettingsPanel
          apps={apps}
          settings={settings}
          focusAdd={focusAdd}
          onClose={closeOverlay}
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
          onClose={closeOverlay}
          onLaunch={handleLaunch}
          onOpenExternal={openTab}
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

      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </div>
  );
}
