import { SceneGrip } from "./SceneGrip";

interface TopBarProps {
  clock: string;
  date: string;
  greetingTitle: string;
  greetingLine: string;
  onOpenPalette: () => void;
  onOpenSettings: () => void;
}

export function TopBar({
  clock,
  date,
  greetingTitle,
  greetingLine,
  onOpenPalette,
  onOpenSettings,
}: TopBarProps) {
  return (
    <header className="relative z-10 flex shrink-0 flex-wrap items-center gap-4 px-4 py-3 md:px-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center border border-cyan-400/50 bg-cyan-400/10">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-cyan-200" aria-hidden="true">
            <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <circle cx="12" cy="12" r="3" fill="currentColor" />
          </svg>
        </span>
        <div className="hud-obj-wordmark">
          <p className="font-hud glow-text text-[11px] tracking-[0.42em] text-cyan-300">J.A.R.V.I.S.</p>
          <h1 className="text-lg font-semibold text-cyan-50 md:text-xl">鐵人指揮中心</h1>
        </div>
      </div>
      <SceneGrip />

      <div className="hidden min-w-0 flex-1 px-4 lg:block">
        <p className="text-sm text-cyan-50">{greetingTitle}</p>
        <p className="text-xs leading-relaxed text-cyan-200/70 [word-break:keep-all]">{greetingLine}</p>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="text-right">
          <p className="font-hud glow-text text-xl tracking-[0.12em] text-cyan-100 md:text-2xl">{clock}</p>
          <p className="font-mono text-[11px] text-cyan-300/70">{date}</p>
        </div>
        <button
          type="button"
          onClick={onOpenPalette}
          className="flex items-center gap-2 border border-cyan-400/30 px-3 py-2 text-sm text-cyan-100"
        >
          指令 <span className="kbd">/</span>
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          className="border border-cyan-400/40 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-50"
        >
          設定
        </button>
      </div>

      <div className="w-full lg:hidden">
        <p className="text-sm text-cyan-100">{greetingTitle}</p>
        <p className="text-xs text-cyan-200/60">{greetingLine}</p>
      </div>
    </header>
  );
}
