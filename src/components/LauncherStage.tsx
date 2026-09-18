import { useMemo } from "react";
import type { AppModule } from "../types";
import { AppCard } from "./AppCard";
import { ArcReactor } from "./HudDecor";

interface LauncherStageProps {
  apps: AppModule[];
  dense?: boolean;
  activeId?: string | null;
  reducedMotion?: boolean;
  onLaunch: (app: AppModule) => void;
  onOpenExternal: (app: AppModule) => void;
  onConfigure: (app: AppModule) => void;
}

export function LauncherStage({
  apps,
  dense,
  activeId,
  reducedMotion,
  onLaunch,
  onOpenExternal,
  onConfigure,
}: LauncherStageProps) {
  const visible = apps.filter((app) => app.enabled);
  const hiddenCount = apps.length - visible.length;

  const useRadial = !dense && visible.length > 0 && visible.length <= 5;
  const radial = useMemo(() => {
    return visible.map((app, index) => {
      const angle = -90 + (360 / Math.max(visible.length, 1)) * index;
      const rad = (angle * Math.PI) / 180;
      const radius = 36;
      return {
        app,
        left: `${50 + radius * Math.cos(rad)}%`,
        top: `${50 + radius * Math.sin(rad)}%`,
        tiltY: Math.cos(rad) * 6,
        tiltX: Math.sin(rad) * -5,
        depth: Math.round(Math.sin(rad) * 52 + 8),
      };
    });
  }, [visible]);

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-visible">
      {useRadial && (
        <div className="hud-orbit-wrap mx-auto hidden h-full min-h-0 w-full max-w-[980px] xl:flex xl:items-center xl:justify-center">
          <div className="hud-orbit relative aspect-square w-full max-w-[min(100%,720px)]">
            <div className="absolute top-1/2 left-1/2 z-0 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
              <div className="hud-obj-core flex flex-col items-center">
                <ArcReactor size={196} />
                <p className="font-hud mt-2 text-[11px] tracking-[0.4em] text-cyan-300/80">MARK · PORTAL</p>
              </div>
            </div>
            {radial.map(({ app, left, top, tiltX, tiltY, depth }) => (
              <div
                key={app.id}
                className="hud-card-slot absolute z-10 w-[236px]"
                style={{
                  left,
                  top,
                  transform: reducedMotion
                    ? `translate(-50%, -50%) translateZ(${depth}px)`
                    : `translate(-50%, -50%) translateZ(${depth}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
                }}
              >
                <AppCard
                  app={app}
                  compact
                  active={activeId === app.id}
                  reducedMotion={reducedMotion}
                  onLaunch={onLaunch}
                  onOpenExternal={onOpenExternal}
                  onConfigure={onConfigure}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        data-scroll={dense ? true : undefined}
        className={
          dense
            ? "grid gap-3 overflow-auto px-3 pb-4"
            : useRadial
              ? "grid gap-3 px-3 pb-4 md:grid-cols-2 xl:hidden"
              : "grid gap-3 overflow-auto px-3 pb-4 md:grid-cols-2 xl:grid-cols-3"
        }
      >
        {visible.map((app, index) => (
          <div
            key={app.id}
            className="hud-card-slot"
            style={{ translate: `0 0 ${(index % 3) * 14 - 10}px` }}
          >
            <AppCard
              app={app}
              compact={dense}
              active={activeId === app.id}
              reducedMotion={reducedMotion}
              onLaunch={onLaunch}
              onOpenExternal={onOpenExternal}
              onConfigure={onConfigure}
            />
          </div>
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
