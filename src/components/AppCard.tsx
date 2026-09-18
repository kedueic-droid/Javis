import { useCallback, useRef, type PointerEvent } from "react";
import { cn } from "../lib/cn";
import { deriveStatus, statusLabel } from "../lib/time";
import type { AppModule } from "../types";
import { AppIcon } from "./icons";

interface AppCardProps {
  app: AppModule;
  compact?: boolean;
  active?: boolean;
  reducedMotion?: boolean;
  onLaunch: (app: AppModule) => void;
  onOpenExternal: (app: AppModule) => void;
  onConfigure: (app: AppModule) => void;
}

export function AppCard({
  app,
  compact,
  active,
  reducedMotion,
  onLaunch,
  onOpenExternal,
  onConfigure,
}: AppCardProps) {
  const status = deriveStatus(app.url, app.enabled);
  const canLaunch = Boolean(app.url.trim()) && app.enabled;
  const cardRef = useRef<HTMLElement>(null);

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (reducedMotion) return;
      const el = cardRef.current;
      if (!el) return;
      if (el.closest(".hud-root")?.hasAttribute("data-hud-dragging")) return;
      const rect = el.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rx = (0.5 - y) * 10;
      const ry = (x - 0.5) * 12;
      el.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
      el.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
      el.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateZ(14px)`;
    },
    [reducedMotion],
  );

  const resetTilt = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = "rotateX(0deg) rotateY(0deg) translateZ(0)";
  }, []);

  return (
    <article
      ref={cardRef}
      onPointerMove={onPointerMove}
      onPointerLeave={resetTilt}
      className={cn(
        "holo-card panel group flex flex-col gap-3 p-4",
        !app.enabled && "opacity-55",
        compact ? "min-h-[152px]" : "min-h-[196px]",
        active && "holo-card-active",
      )}
    >
      <span className="card-shine" aria-hidden="true" />
      <div className="relative flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-cyan-400/40 bg-cyan-400/10 text-cyan-200">
          <AppIcon name={app.icon} className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[15px] leading-snug font-semibold text-cyan-50 [word-break:keep-all]">
              {app.name}
            </h3>
            <StatusBadge status={status} />
          </div>
          <p className="font-mono mt-0.5 text-[10px] tracking-wider text-cyan-300/60">{app.repoHint}</p>
        </div>
      </div>

      <p className="relative line-clamp-2 text-sm leading-relaxed text-cyan-100/75 [word-break:keep-all]">
        {app.description}
      </p>

      <p className="font-hud relative mt-auto text-[10px] tracking-[0.16em] text-blue-200/80">{app.stack}</p>

      <div className="relative flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!canLaunch}
          onClick={() => onLaunch(app)}
          className="bg-cyan-400/15 px-3 py-1.5 text-sm text-cyan-50 hover:bg-cyan-400/25 disabled:cursor-not-allowed disabled:opacity-40"
        >
          啟動
        </button>
        <button
          type="button"
          disabled={!canLaunch}
          onClick={() => onOpenExternal(app)}
          className="border border-cyan-400/30 px-3 py-1.5 text-sm text-cyan-100 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          外部開啟
        </button>
        <button
          type="button"
          onClick={() => onConfigure(app)}
          className="ml-auto text-sm text-cyan-300/80 hover:text-cyan-100"
        >
          設定
        </button>
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: ReturnType<typeof deriveStatus> }) {
  const color =
    status === "standby"
      ? "text-cyan-300"
      : status === "unconfigured"
        ? "text-amber-300"
        : status === "disabled"
          ? "text-zinc-400"
          : "text-emerald-300";

  return (
    <span className={cn("flex shrink-0 items-center gap-1.5 font-hud text-[10px] tracking-[0.18em] whitespace-nowrap", color)}>
      <span className="status-dot bg-current" />
      {statusLabel(status)}
    </span>
  );
}
