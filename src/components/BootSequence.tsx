import { useEffect, useState } from "react";
import { ArcReactor } from "./HudDecor";

const STEPS = [
  "載入核心協議 …… 完成",
  "校準全息介面 …… 完成",
  "掃描應用目錄 …… 完成",
  "語音子系統 …… 待命（靜音）",
  "網路鏈路 …… 就緒",
];

interface BootSequenceProps {
  reducedMotion: boolean;
  onDone: () => void;
}

export function BootSequence({ reducedMotion, onDone }: BootSequenceProps) {
  const [step, setStep] = useState(reducedMotion ? STEPS.length : 0);
  const [progress, setProgress] = useState(reducedMotion ? 100 : 6);

  useEffect(() => {
    if (reducedMotion) {
      const t = window.setTimeout(onDone, 400);
      return () => window.clearTimeout(t);
    }

    const timers: number[] = [];
    STEPS.forEach((_, i) => {
      timers.push(window.setTimeout(() => setStep(i + 1), 380 * (i + 1)));
    });
    timers.push(
      window.setTimeout(() => {
        setProgress(100);
      }, 1900),
    );
    timers.push(window.setTimeout(onDone, 2600));
    const prog = window.setInterval(() => {
      setProgress((p) => Math.min(96, p + 7));
    }, 180);
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      window.clearInterval(prog);
    };
  }, [onDone, reducedMotion]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#02060c] px-6"
      role="dialog"
      aria-label="系統開機"
    >
      <div className="hud-grid opacity-70" />
      <div className="scanlines" />
      <div className="relative z-10 flex w-full max-w-lg flex-col items-center text-center">
        <ArcReactor size={168} />
        <p className="font-hud mt-6 text-xs tracking-[0.5em] text-cyan-300/80">
          STARK INDUSTRIES
        </p>
        <h1 className="font-hud glow-text mt-2 text-3xl text-cyan-200 md:text-4xl">
          J.A.R.V.I.S.
        </h1>
        <p className="mt-1 text-sm tracking-[0.35em] text-cyan-100/70">鐵人指揮中心</p>

        <div className="mt-8 w-full space-y-1.5 text-left font-mono text-[13px] text-cyan-200/80">
          {STEPS.slice(0, step).map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>

        <div className="mt-6 h-1.5 w-full overflow-hidden bg-cyan-950/80">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-cyan-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="font-hud mt-2 text-[11px] tracking-[0.3em] text-cyan-300/70">
          SYSTEMS ONLINE {Math.round(progress)}%
        </p>

        <button
          type="button"
          onClick={onDone}
          className="mt-8 border border-cyan-400/40 px-4 py-1.5 text-sm text-cyan-100 hover:bg-cyan-400/10"
        >
          略過開機動畫
        </button>
      </div>
    </div>
  );
}
