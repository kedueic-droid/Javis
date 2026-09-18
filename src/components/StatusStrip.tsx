import { SUGGESTED_PORTS } from "../data/defaults";
import { deriveStatus } from "../lib/time";
import type { AppModule } from "../types";

export function StatusStrip({ apps, clock }: { apps: AppModule[]; clock: string }) {
  const enabled = apps.filter((a) => a.enabled);
  const ready = enabled.filter((a) => deriveStatus(a.url, a.enabled) === "standby").length;
  const pending = enabled.length - ready;

  const cells = [
    { k: "CORE", v: "ONLINE" },
    { k: "NET", v: "STABLE" },
    { k: "APPS", v: `${ready}/${enabled.length}` },
    { k: "CFG", v: pending ? `${pending} PENDING` : "CLEAR" },
    { k: "CLK", v: clock },
  ];

  return (
    <section
      className="panel mx-3 mb-3 grid grid-cols-2 gap-px overflow-hidden md:mx-4 md:grid-cols-5"
      aria-label="系統狀態"
    >
      {cells.map((cell) => (
        <div key={cell.k} className="flex items-center justify-between gap-3 bg-black/25 px-3 py-2">
          <span className="font-hud text-[10px] tracking-[0.25em] text-cyan-400/70">{cell.k}</span>
          <span className="font-mono text-xs text-cyan-100">{cell.v}</span>
        </div>
      ))}
      <p className="sr-only">
        建議埠位：
        {SUGGESTED_PORTS.map((p) => `${p.name} ${p.port}`).join("、")}
      </p>
    </section>
  );
}
