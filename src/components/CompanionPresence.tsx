import { useEffect, useRef } from "react";
import { cn } from "../lib/cn";

const TRAIL = 7;

interface CompanionPresenceProps {
  reducedMotion: boolean;
  attentive: boolean;
}

function homePoint(): { x: number; y: number } {
  return {
    x: window.innerWidth * 0.5,
    y: Math.min(window.innerHeight * 0.74, window.innerHeight - 88),
  };
}

export function CompanionPresence({ reducedMotion, attentive }: CompanionPresenceProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const pupilRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<Array<HTMLSpanElement | null>>([]);

  useEffect(() => {
    const body = bodyRef.current;
    const pupil = pupilRef.current;
    if (!body || !pupil) return;

    const placeStill = () => {
      const home = homePoint();
      body.style.transform = `translate3d(${home.x}px, ${home.y}px, 0)`;
      pupil.style.transform = "translate(-50%, -50%)";
      for (const dot of trailRefs.current) {
        if (dot) dot.style.opacity = "0";
      }
    };

    if (reducedMotion) {
      placeStill();
      window.addEventListener("resize", placeStill);
      return () => window.removeEventListener("resize", placeStill);
    }

    const home = homePoint();
    let x = home.x;
    let y = home.y;
    let vx = 0;
    let vy = 0;
    let pointerX = home.x;
    let pointerY = home.y - 28;
    let away = true;
    let idleFor = 0;
    let last = performance.now();
    const history: Array<{ x: number; y: number }> = [];
    let raf = 0;
    let running = true;

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      away = false;
      pointerX = event.clientX;
      pointerY = event.clientY;
    };

    const onOut = (event: MouseEvent) => {
      if (event.relatedTarget instanceof Node) return;
      const left =
        event.clientX <= 0 ||
        event.clientY <= 0 ||
        event.clientX >= window.innerWidth - 1 ||
        event.clientY >= window.innerHeight - 1;
      if (left) away = true;
    };

    const tick = (now: number) => {
      if (!running) return;
      if (document.hidden) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const dt = Math.min(48, now - last);
      last = now;
      const rest = homePoint();
      const margin = 42;
      const targetX = away
        ? rest.x
        : Math.max(margin, Math.min(window.innerWidth - margin, pointerX + 30));
      const targetY = away
        ? rest.y
        : Math.max(margin, Math.min(window.innerHeight - margin, pointerY + 26));
      const stiffness = away ? 0.028 : 0.085;
      const damping = away ? 0.84 : 0.74;
      vx = (vx + (targetX - x) * stiffness) * damping;
      vy = (vy + (targetY - y) * stiffness) * damping;
      x += vx;
      y += vy;
      const speed = Math.hypot(vx, vy);
      idleFor = speed < 0.4 ? idleFor + dt : 0;
      const bob = !away && idleFor > 700 ? Math.sin(now / 520) * 1.7 : 0;
      body.style.transform = `translate3d(${x}px, ${y + bob}px, 0)`;

      const lookX = pointerX - x;
      const lookY = pointerY - (y + bob);
      const dist = Math.hypot(lookX, lookY) || 1;
      const reach = away ? 0 : Math.min(6.5, dist * 0.08);
      pupil.style.transform = `translate(calc(-50% + ${(lookX / dist) * reach}px), calc(-50% + ${(lookY / dist) * reach}px))`;

      const lastSample = history[0];
      if (!lastSample || Math.hypot(x - lastSample.x, y - lastSample.y) > 12) {
        history.unshift({ x, y });
        if (history.length > TRAIL) history.pop();
      }
      const fade = away && speed < 0.8;
      history.forEach((point, index) => {
        const dot = trailRefs.current[index];
        if (!dot) return;
        dot.style.transform = `translate3d(${point.x}px, ${point.y}px, 0)`;
        dot.style.opacity = fade ? "0" : String(0.42 * (1 - index / TRAIL));
      });
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseout", onOut);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseout", onOut);
    };
  }, [reducedMotion]);

  return (
    <div className={cn("jarvis-companion", reducedMotion && "is-still", attentive && "is-attentive")} aria-hidden="true">
      {Array.from({ length: TRAIL }, (_, index) => (
        <span
          key={index}
          ref={(node) => {
            trailRefs.current[index] = node;
          }}
          className="jarvis-companion-trail"
        />
      ))}
      <div ref={bodyRef} className="jarvis-companion-body">
        <span className="jarvis-companion-halo" />
        <span className="jarvis-companion-ring" />
        <span className="jarvis-companion-ring jarvis-companion-ring-inner" />
        <span className="jarvis-companion-core">
          <span ref={pupilRef} className="jarvis-companion-pupil" />
        </span>
        <span className="jarvis-companion-tick jarvis-companion-tick-h" />
        <span className="jarvis-companion-tick jarvis-companion-tick-v" />
      </div>
    </div>
  );
}
