import type { AppModule } from "../types";
import { SolarSystemStage } from "./SolarSystemStage";

interface LauncherStageProps {
  apps: AppModule[];
  dense?: boolean;
  activeId?: string | null;
  reducedMotion?: boolean;
  onLaunch: (app: AppModule) => void;
  onConfigure: (app: AppModule) => void;
}

export function LauncherStage({
  apps,
  dense,
  activeId,
  reducedMotion,
  onLaunch,
  onConfigure,
}: LauncherStageProps) {
  const hiddenCount = apps.filter((app) => !app.enabled).length;

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <SolarSystemStage
        apps={apps}
        dense={dense}
        activeId={activeId}
        reducedMotion={reducedMotion}
        onLaunch={onLaunch}
        onConfigure={onConfigure}
      />

      {dense && (
        <div data-scroll className="solar-dense-strip">
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
