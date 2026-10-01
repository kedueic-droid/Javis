import { FLEET_GROUP_LABEL } from "../data/fleet";
import { deriveStatus } from "../lib/time";
import type { AppModule, FleetAgent } from "../types";
import { AppIcon, IconFleet } from "./icons";

interface SideRailProps {
  apps: AppModule[];
  fleet: FleetAgent[];
  logs: string[];
  activeId?: string | null;
  onSelect: (app: AppModule) => void;
  onSelectFleet: (agent: FleetAgent) => void;
  onOpenSettings: () => void;
}

export function SideRail({ apps, fleet, logs, activeId, onSelect, onSelectFleet, onOpenSettings }: SideRailProps) {
  return (
    <aside className="relative z-10 flex min-h-0 w-full flex-1 flex-col gap-4 px-3 pb-3">
      <nav className="panel flex min-h-0 flex-[1.35] flex-col overflow-hidden p-3" aria-label="模組清單">
        <div data-scroll className="min-h-0 flex-1 space-y-1 overflow-auto">
          <p className="font-hud mb-2 px-1 text-[10px] tracking-[0.3em] text-cyan-400/70">MODULES</p>
          <ul className="space-y-1">
            {apps.map((app) => {
              const ready = Boolean(app.enabled && app.url.trim());
              const active = activeId === app.id;
              return (
                <li key={app.id}>
                  <button
                    type="button"
                    onClick={() => (ready ? onSelect(app) : onOpenSettings())}
                    className={`flex w-full items-center gap-2 px-2 py-2 text-left text-sm text-cyan-100 hover:bg-cyan-400/10 ${
                      active ? "bg-cyan-400/15 shadow-[inset_2px_0_0_#00e5ff]" : ""
                    }`}
                  >
                    <AppIcon name={app.icon} className="h-4 w-4 shrink-0 text-cyan-300" />
                    <span className="min-w-0 flex-1 truncate">{app.name}</span>
                    <span
                      className={`status-dot ${ready ? "bg-cyan-300 text-cyan-300" : "bg-amber-300 text-amber-300"}`}
                      title={deriveStatus(app.url, app.enabled)}
                    />
                  </button>
                </li>
              );
            })}
          </ul>

          <p className="font-hud mt-4 mb-2 px-1 text-[10px] tracking-[0.3em] text-amber-200/80">{FLEET_GROUP_LABEL}</p>
          <ul className="space-y-1">
            {fleet.map((agent) => {
              const active = activeId === agent.id;
              return (
                <li key={agent.id}>
                  <button
                    type="button"
                    onClick={() => onSelectFleet(agent)}
                    className={`flex w-full items-center gap-2 px-2 py-2 text-left text-sm text-amber-50 hover:bg-amber-200/10 ${
                      active ? "bg-amber-200/15 shadow-[inset_2px_0_0_#f0c14b]" : ""
                    }`}
                  >
                    <IconFleet className="h-4 w-4 shrink-0 text-amber-200" />
                    <span className="min-w-0 flex-1 truncate">{agent.name}</span>
                    <span className="status-dot bg-amber-200 text-amber-200" title="代理人橋接" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <section className="panel flex min-h-0 flex-1 flex-col p-3">
        <p className="font-hud mb-2 text-[10px] tracking-[0.3em] text-cyan-400/70">SYS LOG</p>
        <ul data-scroll className="space-y-1.5 overflow-auto font-mono text-[11px] text-cyan-200/70">
          {logs.slice(0, 12).map((line, i) => (
            <li key={`${i}-${line}`}>{line}</li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
