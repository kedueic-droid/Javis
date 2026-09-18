export function HudDecor({ reducedMotion }: { reducedMotion: boolean }) {
  const particles = reducedMotion
    ? []
    : [8, 18, 27, 36, 44, 53, 61, 72, 81, 89].map((left, i) => ({
        left,
        delay: i * 1.1,
        duration: 10 + (i % 5) * 1.4,
      }));

  return (
    <>
      <div className="hud-grid" />
      <div className="hud-circuit" />
      <div className="hud-vignette" />
      <div className="scanlines" />
      {!reducedMotion && <div className="scan-sweep" />}
      <div className="particles" aria-hidden="true">
        {particles.map((p) => (
          <span
            key={p.left}
            className="particle"
            style={{
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>
    </>
  );
}

export function CornerMarks() {
  return (
    <div className="pointer-events-none absolute inset-3 z-20 md:inset-4" aria-hidden="true">
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
      className="pulse-core"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#b8fbff" />
          <stop offset="45%" stopColor="#00e5ff" />
          <stop offset="100%" stopColor="#00384a" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="92" fill="none" stroke="rgba(0,229,255,0.15)" strokeWidth="1" />
      <g className="arc-spin origin-center" style={{ transformOrigin: "100px 100px" }}>
        <circle
          cx="100"
          cy="100"
          r="78"
          fill="none"
          stroke="#00e5ff"
          strokeWidth="1.4"
          strokeDasharray="18 10 4 12"
          opacity="0.7"
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
          opacity="0.8"
        />
      </g>
      <circle cx="100" cy="100" r="38" fill="none" stroke="rgba(0,229,255,0.55)" strokeWidth="2" />
      <circle cx="100" cy="100" r="22" fill="url(#coreGlow)" />
      <circle cx="100" cy="100" r="8" fill="#041018" />
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <line
          key={deg}
          x1="100"
          y1="48"
          x2="100"
          y2="58"
          stroke="#00e5ff"
          strokeWidth="1.4"
          transform={`rotate(${deg} 100 100)`}
          opacity="0.8"
        />
      ))}
    </svg>
  );
}
