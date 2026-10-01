import { useEffect, useRef, useState } from "react";
import { FLEET_GROUP_LABEL } from "../data/fleet";
import { subscribeSolarCam } from "../lib/solarCamera";
import type { SolarSceneHandle } from "../lib/solarScene";
import { deriveStatus, statusLabel } from "../lib/time";
import type { AppModule, FleetAgent } from "../types";

interface SolarSystemStageProps {
  apps: AppModule[];
  fleet: FleetAgent[];
  fleetMission: (agent: FleetAgent) => string;
  activeId?: string | null;
  reducedMotion?: boolean;
  dense?: boolean;
  onLaunch: (app: AppModule) => void;
  onLaunchFleet: (agent: FleetAgent) => void;
  onConfigure: (app: AppModule) => void;
}

export function SolarSystemStage({
  apps,
  fleet,
  fleetMission,
  activeId,
  reducedMotion,
  dense,
  onLaunch,
  onLaunchFleet,
  onConfigure,
}: SolarSystemStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<SolarSceneHandle | null>(null);
  const appsRef = useRef(apps);
  const fleetRef = useRef(fleet);
  const activeRef = useRef(activeId ?? null);
  const reducedRef = useRef(Boolean(reducedMotion));
  const launchRef = useRef(onLaunch);
  const launchFleetRef = useRef(onLaunchFleet);
  const configureRef = useRef(onConfigure);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [webglError, setWebglError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  appsRef.current = apps;
  fleetRef.current = fleet;
  activeRef.current = activeId ?? null;
  reducedRef.current = Boolean(reducedMotion);
  launchRef.current = onLaunch;
  launchFleetRef.current = onLaunchFleet;
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
              getFleet: () => fleetRef.current.map((agent) => ({ id: agent.id, name: agent.name })),
              getActiveId: () => activeRef.current,
              getReducedMotion: () => reducedRef.current,
              onSelect: (id) => {
                const agent = fleetRef.current.find((item) => item.id === id);
                if (agent) {
                  launchFleetRef.current(agent);
                  return;
                }
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
  }, [apps, fleet]);

  const hoveredFleet = fleet.find((agent) => agent.id === hoveredId) ?? null;
  const hoveredApp = apps.find((app) => app.id === hoveredId) ?? null;
  const featuredFleet = hoveredFleet ?? (hoveredId ? null : (fleet.find((agent) => agent.id === activeId) ?? null));
  const featuredApp = hoveredApp ?? (hoveredId ? null : (apps.find((app) => app.id === activeId) ?? null));

  return (
    <div className={`solar-stage ${dense ? "is-dense" : ""}`}>
      <canvas ref={canvasRef} className="solar-canvas" aria-hidden="true" />
      <div ref={overlayRef} className="solar-overlay" />

      <p className="solar-legend">
        <span>內圈 · 應用行星</span>
        <span>外圈 · {FLEET_GROUP_LABEL}</span>
      </p>

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
        {fleet.map((agent) => (
          <button key={agent.id} type="button" onClick={() => onLaunchFleet(agent)}>
            橋接 {agent.name}
          </button>
        ))}
      </nav>

      <div className="solar-hud" aria-live="polite">
        <p className="solar-hint">
          {dense
            ? "行星仍在軌道運行 · 點選可切換投影或代理人"
            : "點選內圈行星投影模組 · 外圈晶體為 AI 艦隊 · 拖曳空白處環繞星系"}
        </p>
        {featuredFleet && (
          <div className="solar-caption is-fleet">
            <p className="solar-caption-kicker">{FLEET_GROUP_LABEL}</p>
            <h2>{featuredFleet.name}</h2>
            <p className="solar-caption-desc">{featuredFleet.role}</p>
            <p className="solar-caption-stack">{fleetMission(featuredFleet)}</p>
          </div>
        )}
        {featuredApp && (
          <div className="solar-caption">
            <p className="solar-caption-kicker">{statusLabel(deriveStatus(featuredApp.url, featuredApp.enabled))}</p>
            <h2>{featuredApp.name}</h2>
            <p className="solar-caption-desc">{featuredApp.description}</p>
            <p className="solar-caption-stack">{featuredApp.stack}</p>
          </div>
        )}
      </div>
    </div>
  );
}
