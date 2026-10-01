import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  z: number;
  s: number;
  v: number;
}

export function HudCanvas({ reducedMotion }: { reducedMotion: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;

    const count = reducedMotion ? 16 : 52;
    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: Math.random(),
      s: 0.6 + Math.random() * 1.6,
      v: 0.06 + Math.random() * 0.22,
    }));

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      const gx = width * 0.5;
      const gy = height * 0.42;
      const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, Math.max(width, height) * 0.28);
      glow.addColorStop(0, "rgba(0,229,255,0.08)");
      glow.addColorStop(0.45, "rgba(61,158,255,0.03)");
      glow.addColorStop(1, "rgba(0,229,255,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      if (!reducedMotion) {
        const sweepY = ((time / 7800) % 1) * (height + 80) - 40;
        const sweep = ctx.createLinearGradient(0, sweepY, 0, sweepY + 70);
        sweep.addColorStop(0, "rgba(0,229,255,0)");
        sweep.addColorStop(0.5, "rgba(0,229,255,0.055)");
        sweep.addColorStop(1, "rgba(0,229,255,0)");
        ctx.fillStyle = sweep;
        ctx.fillRect(0, sweepY, width, 70);
      }

      for (const p of particles) {
        if (!reducedMotion) {
          p.y -= p.v / Math.max(height, 1) * 14;
          if (p.y < -0.03) {
            p.y = 1.03;
            p.x = Math.random();
          }
        }

        const alpha = 0.12 + p.z * 0.5;
        ctx.fillStyle = `rgba(180,250,255,${alpha})`;
        ctx.fillRect(p.x * width, p.y * height, p.s, p.s);
      }
    };

    const tick = (time: number) => {
      draw(time);
      if (!reducedMotion) raf = requestAnimationFrame(tick);
    };

    resize();
    draw(0);
    if (!reducedMotion) raf = requestAnimationFrame(tick);

    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reducedMotion]);

  return <canvas ref={canvasRef} className="hud-canvas" aria-hidden="true" />;
}
