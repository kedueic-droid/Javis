import { useEffect, useState } from "react";
import { FLEET_SIDEBAR_HINT, fleetDeepLink } from "../data/fleet";
import { copyText } from "../lib/clipboard";
import type { FleetAgent, ToastMessage } from "../types";

interface AgentBridgeProps {
  agent: FleetAgent;
  mission: string;
  shieldPointer?: boolean;
  onMissionChange: (agentId: string, text: string) => void;
  onResetMission: (agentId: string) => void;
  onClose: () => void;
  onOpenPalette: () => void;
  onNotify: (text: string, tone?: ToastMessage["tone"]) => void;
}

export function AgentBridge({
  agent,
  mission,
  shieldPointer,
  onMissionChange,
  onResetMission,
  onClose,
  onOpenPalette,
  onNotify,
}: AgentBridgeProps) {
  const link = fleetDeepLink(agent.id);
  const [copied, setCopied] = useState<"hint" | "link" | null>(null);

  useEffect(() => {
    setCopied(null);
  }, [agent.id]);

  async function copy(kind: "hint" | "link") {
    const value = kind === "hint" ? `${FLEET_SIDEBAR_HINT}：${agent.name}` : link;
    const ok = await copyText(value);
    if (!ok) {
      onNotify("無法寫入剪貼簿，請手動選取文字", "warn");
      return;
    }
    setCopied(kind);
    onNotify(kind === "hint" ? "已複製開啟提示" : "已複製深連結", "ok");
  }

  return (
    <section
      className="embed-stage panel flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
      aria-label={`${agent.name} 代理人橋接`}
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-amber-200/25 px-3 py-2.5 md:px-4">
        <div className="min-w-0 flex-1">
          <p className="font-hud text-[10px] tracking-[0.3em] text-amber-200/80">AGENT BRIDGE</p>
          <h2 className="truncate text-base text-cyan-50">{agent.name}</h2>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onOpenPalette}
            className="border border-amber-200/40 px-3 py-1.5 text-sm text-amber-50 hover:bg-amber-200/10"
          >
            派工
          </button>
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm text-cyan-200 hover:text-white">
            關閉
          </button>
        </div>
      </header>

      <div className="relative min-h-0 flex-1 overflow-hidden bg-black/55">
      <div className="h-full overflow-auto px-4 py-4 md:px-5" data-no-scene-drag data-scroll>
        <p className="font-hud text-[10px] tracking-[0.28em] text-amber-200/75">ROLE</p>
        <p className="mt-1 text-sm leading-relaxed text-cyan-50">{agent.role}</p>

        <label className="mt-5 block">
          <span className="font-hud text-[10px] tracking-[0.28em] text-amber-200/75">目前任務</span>
          <textarea
            value={mission}
            onChange={(event) => onMissionChange(agent.id, event.target.value)}
            rows={4}
            aria-label={`${agent.name} 目前任務`}
            className="mt-2 w-full px-3 py-2 text-sm leading-relaxed"
          />
        </label>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onResetMission(agent.id)}
            className="text-xs text-cyan-200/80 hover:text-cyan-50"
          >
            還原預設任務
          </button>
          <p className="text-xs text-cyan-200/50">任務筆記存在此瀏覽器。</p>
        </div>

        <div className="mt-6 border border-amber-200/25 bg-amber-200/5 px-3 py-3">
          <p className="text-sm leading-relaxed text-amber-50">{FLEET_SIDEBAR_HINT}</p>
          <p className="mt-1 font-mono text-xs text-amber-100/70">{agent.name}</p>
          <button
            type="button"
            onClick={() => void copy("hint")}
            className="mt-3 border border-amber-200/40 px-3 py-1.5 text-sm text-amber-50 hover:bg-amber-200/10"
          >
            {copied === "hint" ? "已複製提示" : "複製開啟提示"}
          </button>
        </div>

        <div className="mt-4">
          <label className="block" htmlFor={`fleet-link-${agent.id}`}>
            <span className="font-hud text-[10px] tracking-[0.28em] text-cyan-300/70">DEEP LINK</span>
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              id={`fleet-link-${agent.id}`}
              readOnly
              value={link}
              aria-label={`${agent.name} 深連結`}
              className="w-full px-3 py-2 font-mono text-xs"
              onFocus={(event) => event.currentTarget.select()}
            />
            <button
              type="button"
              onClick={() => void copy("link")}
              className="shrink-0 border border-cyan-400/40 px-3 py-2 text-sm text-cyan-50 hover:bg-cyan-400/10"
            >
              {copied === "link" ? "已複製" : "複製"}
            </button>
          </div>
          <p className="mt-2 font-mono text-[11px] text-cyan-300/45">id {agent.id}</p>
        </div>
      </div>
      {shieldPointer && <div className="absolute inset-0 z-10 cursor-col-resize bg-transparent" aria-hidden="true" />}
      </div>
    </section>
  );
}
