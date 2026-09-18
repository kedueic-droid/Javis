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
    <section className="relative z-10 mx-3 mb-3 shrink-0 md:mx-4" aria-label="系統狀態">
      <div className="panel flex flex-wrap items-stretch">
        {cells.map((cell, i) => (
          <div
            key={cell.k}
            className={`flex min-w-[8.5rem] flex-1 items-center justify-center gap-3 px-3 py-2 ${
              i > 0 ? "border-t border-cyan-400/15 sm:border-t-0 sm:border-l" : ""
            }`}
          >
            <span className="font-hud text-[10px] tracking-[0.25em] text-cyan-400/80">{cell.k}</span>
            <span className="font-mono text-xs text-cyan-100">{cell.v}</span>
          </div>
        ))}
      </div>
      <p className="sr-only">
        建議埠位：
        {SUGGESTED_PORTS.map((p) => `${p.name} ${p.port}`).join("、")}
      </p>
    </section>
  );
}
