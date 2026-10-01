import { useState } from "react";
import { FLEET_AGENTS, FLEET_GROUP_LABEL } from "../data/fleet";
import type { FleetCommand, FleetCommandStatus } from "../types";

interface FleetDispatchProps {
  queue: FleetCommand[];
  onEnqueue: (agentId: string, text: string) => { ok: true } | { ok: false; reason: string };
  onRemove: (id: string) => void;
}

const BUCKETS: { status: FleetCommandStatus; title: string; empty: string }[] = [
  { status: "pending", title: "待派", empty: "尚未排入指令。" },
  {
    status: "sent",
    title: "已送出",
    empty: "佔位：連接器尚未接上，這裡不會出現偽造的送出紀錄。",
  },
  {
    status: "result",
    title: "結果",
    empty: "佔位：尚無回報通道。接通後才會顯示代理人回覆。",
  },
];

function formatStamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("zh-TW", { hour12: false, month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function FleetDispatch({ queue, onEnqueue, onRemove }: FleetDispatchProps) {
  const [agentId, setAgentId] = useState(FLEET_AGENTS[0]?.id ?? "");
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const pendingCount = queue.filter((item) => item.status === "pending").length;

  function submit() {
    const result = onEnqueue(agentId, text);
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    setText("");
    setError("");
  }

  return (
    <section className="border-t border-amber-200/25 px-4 py-3" aria-label={FLEET_GROUP_LABEL}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h3 className="font-hud text-[10px] tracking-[0.28em] text-amber-200/85">派工給 AI 艦隊</h3>
        <span className="font-mono text-[11px] text-amber-100/60">待派 {pendingCount}</span>
      </div>
      <p className="mb-3 text-xs leading-relaxed text-cyan-200/55">
        指令只寫入此瀏覽器的佇列，不會呼叫 Grok Bot，也不會把狀態改成已送出。
      </p>

      <div className="grid gap-2">
        <label className="grid gap-1 text-xs text-cyan-100/80">
          代理人
          <select
            value={agentId}
            onChange={(event) => setAgentId(event.target.value)}
            aria-label="派工代理人"
            className="px-2 py-1.5 text-sm"
          >
            {FLEET_AGENTS.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-cyan-100/80">
          指令
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={3}
            placeholder="寫下要交給這名代理人的任務…"
            aria-label="派工指令"
            className="px-2 py-1.5 text-sm"
          />
        </label>
        {error && <p className="text-xs text-amber-200">{error}</p>}
        <button
          type="button"
          onClick={submit}
          className="justify-self-start border border-amber-200/45 px-3 py-1.5 text-sm text-amber-50 hover:bg-amber-200/10"
        >
          排入佇列
        </button>
      </div>

      <div className="mt-4 grid gap-3">
        {BUCKETS.map((bucket) => {
          const items = queue.filter((item) => item.status === bucket.status);
          return (
            <div key={bucket.status}>
              <p className="font-hud text-[10px] tracking-[0.22em] text-cyan-300/70">{bucket.title}</p>
              {items.length === 0 ? (
                <p className="mt-1 text-xs leading-relaxed text-cyan-200/45">{bucket.empty}</p>
              ) : (
                <ul className="mt-1 space-y-1.5">
                  {items.map((item) => (
                    <li key={item.id} className="border border-cyan-400/15 px-2 py-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs text-amber-100/90">
                          {item.agentName}
                          <span className="ml-2 font-mono text-[10px] text-cyan-300/50">{formatStamp(item.createdAt)}</span>
                        </p>
                        {item.status === "pending" && (
                          <button
                            type="button"
                            onClick={() => onRemove(item.id)}
                            className="shrink-0 text-[11px] text-cyan-200/70 hover:text-cyan-50"
                          >
                            移除
                          </button>
                        )}
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-cyan-50">{item.text}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
