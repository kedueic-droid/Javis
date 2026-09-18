import { useMemo } from "react";
import type { AppModule } from "../types";
import { AppCard } from "./AppCard";
import { ArcReactor } from "./HudDecor";

interface LauncherStageProps {
  apps: AppModule[];
  onLaunch: (app: AppModule) => void;
  onEmbed: (app: AppModule) => void;
  onConfigure: (app: AppModule) => void;
}

export function LauncherStage({ apps, onLaunch, onEmbed, onConfigure }: LauncherStageProps) {
  const visible = apps.filter((app) => app.enabled);
  const hiddenCount = apps.length - visible.length;

  const useRadial = visible.length > 0 && visible.length <= 5;
  const radial = useMemo(() => {
    return visible.map((app, index) => {
      const angle = -90 + (360 / Math.max(visible.length, 1)) * index;
      const rad = (angle * Math.PI) / 180;
      const radius = 40;
      return {
        app,
        left: `${50 + radius * Math.cos(rad)}%`,
        top: `${50 + radius * Math.sin(rad)}%`,
      };
    });
  }, [visible]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {useRadial && (
        <div className="mx-auto hidden min-h-[700px] w-full max-w-[1020px] xl:block">
          <div className="relative mx-auto aspect-square w-full max-w-[900px]">
            <div className="absolute top-1/2 left-1/2 z-0 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
              <ArcReactor size={196} />
              <p className="font-hud mt-2 text-[11px] tracking-[0.4em] text-cyan-300/80">MARK · PORTAL</p>
            </div>
            {radial.map(({ app, left, top }) => (
              <div
                key={app.id}
                className="absolute z-10 w-[258px] -translate-x-1/2 -translate-y-1/2"
                style={{ left, top }}
              >
                <AppCard
                  app={app}
                  compact
                  onLaunch={onLaunch}
                  onEmbed={onEmbed}
                  onConfigure={onConfigure}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={useRadial ? "grid gap-3 px-3 pb-4 md:grid-cols-2 xl:hidden" : "grid gap-3 px-3 pb-4 md:grid-cols-2 xl:grid-cols-3"}>
        {visible.map((app) => (
          <AppCard
            key={app.id}
            app={app}
            onLaunch={onLaunch}
            onEmbed={onEmbed}
            onConfigure={onConfigure}
          />
        ))}
      </div>

      {hiddenCount > 0 && (
        <p className="px-4 pb-3 text-center text-xs text-cyan-200/50">
          另有 {hiddenCount} 個模組已停用，可在設定中重新啟用。
        </p>
      )}
    </div>
  );
}
