import { FLEET_GROUP_LABEL } from "../data/fleet";
import type { AppModule, FleetAgent } from "../types";
import { SolarSystemStage } from "./SolarSystemStage";

interface LauncherStageProps {
  apps: AppModule[];
  fleet: FleetAgent[];
  fleetMission: (agent: FleetAgent) => string;
  dense?: boolean;
  activeId?: string | null;
  reducedMotion?: boolean;
  onLaunch: (app: AppModule) => void;
  onLaunchFleet: (agent: FleetAgent) => void;
  onConfigure: (app: AppModule) => void;
}

export function LauncherStage({
  apps,
  fleet,
  fleetMission,
  dense,
  activeId,
  reducedMotion,
  onLaunch,
  onLaunchFleet,
  onConfigure,
}: LauncherStageProps) {
  const hiddenCount = apps.filter((app) => !app.enabled).length;

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <SolarSystemStage
        apps={apps}
        fleet={fleet}
        fleetMission={fleetMission}
        dense={dense}
        activeId={activeId}
        reducedMotion={reducedMotion}
        onLaunch={onLaunch}
        onLaunchFleet={onLaunchFleet}
        onConfigure={onConfigure}
      />

      {dense && (
        <div data-scroll className="solar-dense-strip">
          <span className="solar-chip-label">應用</span>
          {apps
            .filter((app) => app.enabled)
            .map((app) => (
              <button
                key={app.id}
                type="button"
                className={`solar-chip ${activeId === app.id ? "is-active" : ""}`}
                onClick={() => onLaunch(app)}
              >
                {app.name}
              </button>
            ))}
          <span className="solar-chip-label is-fleet">{FLEET_GROUP_LABEL}</span>
          {fleet.map((agent) => (
            <button
              key={agent.id}
              type="button"
              className={`solar-chip is-fleet ${activeId === agent.id ? "is-active" : ""}`}
              onClick={() => onLaunchFleet(agent)}
            >
              {agent.name}
            </button>
          ))}
        </div>
      )}

      {hiddenCount > 0 && (
        <p className="px-4 py-2 text-center text-xs text-cyan-200/50">
          另有 {hiddenCount} 個模組已停用，可在設定中重新啟用。
        </p>
      )}
    </div>
  );
}
