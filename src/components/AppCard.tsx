import { cn } from "../lib/cn";
import { deriveStatus, statusLabel } from "../lib/time";
import type { AppModule } from "../types";
import { AppIcon } from "./icons";

interface AppCardProps {
  app: AppModule;
  compact?: boolean;
  onLaunch: (app: AppModule) => void;
  onEmbed: (app: AppModule) => void;
  onConfigure: (app: AppModule) => void;
}

export function AppCard({ app, compact, onLaunch, onEmbed, onConfigure }: AppCardProps) {
  const status = deriveStatus(app.url, app.enabled);
  const canLaunch = Boolean(app.url.trim()) && app.enabled;

  return (
    <article
      className={cn(
        "panel group flex flex-col gap-3 p-4 transition",
        !app.enabled && "opacity-55",
        compact ? "min-h-[188px]" : "min-h-[210px]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center border border-cyan-400/40 bg-cyan-400/10 text-cyan-200">
            <AppIcon name={app.icon} className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-[15px] font-semibold text-cyan-50">{app.name}</h3>
            <p className="font-mono text-[10px] tracking-wider text-cyan-300/60">{app.repoHint}</p>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      <p className="line-clamp-2 text-sm leading-relaxed text-cyan-100/75">{app.description}</p>

      <p className="font-hud mt-auto text-[10px] tracking-[0.16em] text-blue-200/80">{app.stack}</p>

      <div className="flex flex-wrap gap-2">
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
          onClick={() => onEmbed(app)}
          className="border border-cyan-400/30 px-3 py-1.5 text-sm text-cyan-100 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          內嵌
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
    <span className={cn("flex items-center gap-1.5 font-hud text-[10px] tracking-[0.18em]", color)}>
      <span className="status-dot bg-current" />
      {statusLabel(status)}
    </span>
  );
}
