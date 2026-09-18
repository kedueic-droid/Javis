import { useEffect, useMemo, useRef, useState } from "react";
import { deriveStatus, statusLabel } from "../lib/time";
import type { AppModule } from "../types";
import { AppIcon } from "./icons";

interface CommandPaletteProps {
  apps: AppModule[];
  onClose: () => void;
  onLaunch: (app: AppModule) => void;
  onOpenExternal: (app: AppModule) => void;
  onOpenSettings: () => void;
  onAddApp: () => void;
}

type PaletteItem =
  | { id: string; title: string; hint: string; kind: "app"; app: AppModule }
  | { id: string; title: string; hint: string; kind: "settings" | "add" };

export function CommandPalette({
  apps,
  onClose,
  onLaunch,
  onOpenExternal,
  onOpenSettings,
  onAddApp,
}: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);

  const commands = useMemo((): PaletteItem[] => {
    const q = query.trim().toLowerCase();
    const appItems = apps
      .filter((app) => {
        if (!q) return true;
        return [app.name, app.description, app.stack, app.repoHint, app.url]
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .map((app) => ({
        id: app.id,
        title: app.name,
        hint: `${statusLabel(deriveStatus(app.url, app.enabled))} · ${app.stack}`,
        app,
        kind: "app" as const,
      }));

    const extras = [
      { id: "cmd-settings", title: "開啟設定", hint: "編輯網址、匯入匯出", kind: "settings" as const },
      { id: "cmd-add", title: "新增應用", hint: "加入自訂啟動器", kind: "add" as const },
    ].filter((item) => !q || item.title.includes(query.trim()) || item.hint.includes(query.trim()));

    return [...appItems, ...extras];
  }, [apps, query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setIndex(0);
  }, [query]);

  function run(i: number) {
    const item = commands[i];
    if (!item) return;
    if (item.kind === "settings") {
      onOpenSettings();
      return;
    }
    if (item.kind === "add") {
      onAddApp();
      return;
    }
    if (item.kind === "app" && item.app.enabled && item.app.url.trim()) {
      onLaunch(item.app);
      return;
    }
    onOpenSettings();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/72 px-4 pt-[12vh]" role="dialog" aria-label="指令監視台">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="關閉" onClick={onClose} />
      <div className="panel relative z-10 w-full max-w-xl overflow-hidden bg-[#041018]/95">
        <div className="flex items-center gap-3 border-b border-cyan-400/20 px-4 py-3">
          <span className="font-hud text-[10px] tracking-[0.3em] text-cyan-400/80">COMMAND</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setIndex((n) => Math.min(commands.length - 1, n + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setIndex((n) => Math.max(0, n - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                run(index);
              }
            }}
            placeholder="搜尋應用、指令…"
            className="w-full bg-transparent px-1 py-1 text-cyan-50 outline-none"
            aria-label="搜尋指令"
          />
          <span className="kbd">ESC</span>
        </div>
        <ul className="max-h-[50vh] overflow-auto py-2">
          {commands.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-cyan-200/60">沒有符合的模組</li>
          )}
          {commands.map((item, i) => (
            <li
              key={item.id}
              onMouseEnter={() => setIndex(i)}
              className={`flex items-center gap-2 px-2 py-1 ${i === index ? "bg-cyan-400/15" : ""}`}
            >
              <button
                type="button"
                onClick={() => run(i)}
                className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2 text-left hover:bg-cyan-400/10"
              >
                <span className="flex h-8 w-8 items-center justify-center border border-cyan-400/30 text-cyan-200">
                  {item.kind === "app" ? (
                    <AppIcon name={item.app.icon} className="h-4 w-4" />
                  ) : (
                    <span className="font-hud text-[10px]">CMD</span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-cyan-50">{item.title}</span>
                  <span className="block truncate font-mono text-[11px] text-cyan-300/55">{item.hint}</span>
                </span>
              </button>
              {item.kind === "app" && item.app.url ? (
                <button
                  type="button"
                  className="px-2 text-xs text-cyan-300/80 hover:text-cyan-100"
                  onClick={() => onOpenExternal(item.app)}
                >
                  外部開啟
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
