import { useEffect, useRef, useState } from "react";
import { subscribeSolarCam } from "../lib/solarCamera";
import type { SolarSceneHandle } from "../lib/solarScene";
import { deriveStatus, statusLabel } from "../lib/time";
import type { AppModule } from "../types";

interface SolarSystemStageProps {
  apps: AppModule[];
  activeId?: string | null;
  reducedMotion?: boolean;
  dense?: boolean;
  onLaunch: (app: AppModule) => void;
  onConfigure: (app: AppModule) => void;
}

export function SolarSystemStage({
  apps,
  activeId,
  reducedMotion,
  dense,
  onLaunch,
  onConfigure,
}: SolarSystemStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<SolarSceneHandle | null>(null);
  const appsRef = useRef(apps);
  const activeRef = useRef(activeId ?? null);
  const reducedRef = useRef(Boolean(reducedMotion));
  const launchRef = useRef(onLaunch);
  const configureRef = useRef(onConfigure);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [webglError, setWebglError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  appsRef.current = apps;
  activeRef.current = activeId ?? null;
  reducedRef.current = Boolean(reducedMotion);
  launchRef.current = onLaunch;
  configureRef.current = onConfigure;

  useEffect(() => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay) return;

    let cancelled = false;
    let unsub = () => {};

    void import("../lib/solarScene")
      .then(({ createSolarScene }) => {
        if (cancelled) return;
        try {
          const handle = createSolarScene(
            { canvas, overlay },
            {
              getApps: () => appsRef.current,
              getActiveId: () => activeRef.current,
              getReducedMotion: () => reducedRef.current,
              onSelect: (id) => {
                const app = appsRef.current.find((item) => item.id === id);
                if (!app) return;
                if (!app.enabled || !app.url.trim()) configureRef.current(app);
                else launchRef.current(app);
              },
              onHover: (id) => setHoveredId(id),
            },
          );
          handleRef.current = handle;
          unsub = subscribeSolarCam((cmd) => handle.applyCommand(cmd));
          setReady(true);
        } catch (err) {
          setWebglError(err instanceof Error ? err.message : "WebGL 初始化失敗");
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setWebglError(err instanceof Error ? err.message : "無法載入立體星系");
        }
      });

    return () => {
      cancelled = true;
      unsub();
      handleRef.current?.dispose();
      handleRef.current = null;
    };
  }, []);

  useEffect(() => {
    handleRef.current?.sync();
  }, [apps]);

  const hovered = apps.find((app) => app.id === hoveredId) ?? null;
  const active = apps.find((app) => app.id === activeId) ?? null;
  const featured = hovered ?? active;

  return (
    <div className={`solar-stage ${dense ? "is-dense" : ""}`}>
      <canvas ref={canvasRef} className="solar-canvas" aria-hidden="true" />
      <div ref={overlayRef} className="solar-overlay" />

      {!ready && !webglError && (
        <p className="solar-loading" aria-live="polite">
          載入星系中……
        </p>
      )}

      {webglError && (
        <div className="solar-fallback" role="alert">
          <p>無法啟動立體星系（{webglError}）。請改用側欄或指令監視台啟動模組。</p>
        </div>
      )}

      <nav className="sr-only" aria-label="模組行星清單">
        {apps.map((app) => (
          <button
            key={app.id}
            type="button"
            onClick={() => {
              if (!app.enabled || !app.url.trim()) onConfigure(app);
              else onLaunch(app);
            }}
          >
            啟動 {app.name}
          </button>
        ))}
      </nav>

      <div className="solar-hud" aria-live="polite">
        <p className="solar-hint">
          {dense
            ? "行星仍在左側軌道運行 · 點選可切換投影"
            : "點選行星以投影模組 · 拖曳空白處環繞星系 · 拖曳行星可輕拉軌道"}
        </p>
        {featured && (
          <div className="solar-caption">
            <p className="solar-caption-kicker">{statusLabel(deriveStatus(featured.url, featured.enabled))}</p>
            <h2>{featured.name}</h2>
            <p className="solar-caption-desc">{featured.description}</p>
            <p className="solar-caption-stack">{featured.stack}</p>
          </div>
        )}
      </div>
    </div>
  );
}
