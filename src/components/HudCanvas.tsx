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
    let mx = 0.5;
    let my = 0.42;

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

    const onMove = (event: PointerEvent) => {
      if (width <= 0 || height <= 0) return;
      mx = event.clientX / width;
      my = event.clientY / height;
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      const gx = mx * width;
      const gy = my * height;
      const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, Math.max(width, height) * 0.28);
      glow.addColorStop(0, "rgba(0,229,255,0.13)");
      glow.addColorStop(0.45, "rgba(61,158,255,0.05)");
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

      ctx.lineWidth = 1;
      for (const p of particles) {
        if (!reducedMotion) {
          p.y -= p.v / Math.max(height, 1) * 14;
          p.x += (mx - 0.5) * 0.00035;
          if (p.y < -0.03) {
            p.y = 1.03;
            p.x = Math.random();
          }
          if (p.x < 0) p.x += 1;
          if (p.x > 1) p.x -= 1;
        }

        const px = p.x * width;
        const py = p.y * height;
        const alpha = 0.12 + p.z * 0.5;
        ctx.fillStyle = `rgba(180,250,255,${alpha})`;
        ctx.fillRect(px, py, p.s, p.s);

        const dx = px - gx;
        const dy = py - gy;
        const dist = Math.hypot(dx, dy);
        if (dist < 120) {
          ctx.strokeStyle = `rgba(0,229,255,${0.16 * (1 - dist / 120)})`;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(gx, gy);
          ctx.stroke();
        }
      }

      if (!reducedMotion) {
        const arm = 9;
        ctx.strokeStyle = "rgba(0,229,255,0.45)";
        ctx.beginPath();
        ctx.moveTo(gx - arm, gy);
        ctx.lineTo(gx - 3, gy);
        ctx.moveTo(gx + 3, gy);
        ctx.lineTo(gx + arm, gy);
        ctx.moveTo(gx, gy - arm);
        ctx.lineTo(gx, gy - 3);
        ctx.moveTo(gx, gy + 3);
        ctx.lineTo(gx, gy + arm);
        ctx.stroke();
        ctx.strokeRect(gx - 14, gy - 14, 28, 28);
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
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reducedMotion]);

  return <canvas ref={canvasRef} className="hud-canvas" aria-hidden="true" />;
}
