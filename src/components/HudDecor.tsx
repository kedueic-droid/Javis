import { HudCanvas } from "./HudCanvas";

export function HudDecor({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="hud-scene" aria-hidden="true">
      <div className="hud-layer-far">
        <div className="hud-grid" />
        <div className="hud-circuit" />
      </div>
      <HudCanvas reducedMotion={reducedMotion} />
    </div>
  );
}

export function HudPostFx({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="hud-postfx" aria-hidden="true">
      <div className="hud-vignette" />
      <div className="scanlines" />
      {!reducedMotion && <div className="scan-sweep" />}
      <div className="hud-pointer-glow" />
    </div>
  );
}

export function CornerMarks() {
  return (
    <div className="hud-obj hud-obj-corners pointer-events-none absolute inset-3 z-20 md:inset-4" aria-hidden="true">
      <span className="absolute top-0 left-0 h-8 w-8 border-t-2 border-l-2 border-cyan-300/70" />
      <span className="absolute top-0 right-0 h-8 w-8 border-t-2 border-r-2 border-cyan-300/70" />
      <span className="absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2 border-cyan-300/70" />
      <span className="absolute right-0 bottom-0 h-8 w-8 border-r-2 border-b-2 border-cyan-300/70" />
    </div>
  );
}

export function ArcReactor({ size = 180 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className="pulse-core drop-shadow-[0_0_24px_rgba(0,229,255,0.45)]"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e7ffff" />
          <stop offset="38%" stopColor="#7af6ff" />
          <stop offset="72%" stopColor="#00e5ff" />
          <stop offset="100%" stopColor="#00384a" />
        </radialGradient>
        <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx="100" cy="100" r="96" fill="none" stroke="rgba(0,229,255,0.12)" strokeWidth="1" />
      <g className="arc-spin origin-center" style={{ transformOrigin: "100px 100px" }}>
        <circle
          cx="100"
          cy="100"
          r="86"
          fill="none"
          stroke="#00e5ff"
          strokeWidth="1.1"
          strokeDasharray="4 10 22 8"
          opacity="0.55"
        />
      </g>
      <g className="arc-spin origin-center" style={{ transformOrigin: "100px 100px" }}>
        <circle
          cx="100"
          cy="100"
          r="78"
          fill="none"
          stroke="#00e5ff"
          strokeWidth="1.4"
          strokeDasharray="18 10 4 12"
          opacity="0.75"
          filter="url(#softGlow)"
        />
      </g>
      <g className="arc-spin-rev origin-center" style={{ transformOrigin: "100px 100px" }}>
        <circle
          cx="100"
          cy="100"
          r="62"
          fill="none"
          stroke="#3d9eff"
          strokeWidth="1.2"
          strokeDasharray="8 14"
          opacity="0.85"
        />
      </g>
      <polygon
        points="100,48 128,64 128,96 100,112 72,96 72,64"
        fill="none"
        stroke="rgba(0,229,255,0.35)"
        strokeWidth="0.8"
        opacity="0.9"
      />
      <circle cx="100" cy="100" r="38" fill="none" stroke="rgba(0,229,255,0.6)" strokeWidth="2" />
      <circle cx="100" cy="100" r="24" fill="url(#coreGlow)" />
      <circle cx="100" cy="100" r="8" fill="#041018" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <line
          key={deg}
          x1="100"
          y1={deg % 90 === 0 ? 44 : 50}
          x2="100"
          y2={deg % 90 === 0 ? 56 : 58}
          stroke="#00e5ff"
          strokeWidth={deg % 90 === 0 ? 1.6 : 1.1}
          transform={`rotate(${deg} 100 100)`}
          opacity="0.85"
        />
      ))}
    </svg>
  );
}
