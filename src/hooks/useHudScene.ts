import { useEffect, type RefObject } from "react";
import {
  clampPose,
  copyPose,
  SCENE_LIMITS,
  SCENE_SENS,
  ZERO_POSE,
  type ScenePose,
} from "../lib/scene";

const POSE_KEYS: (keyof ScenePose)[] = ["yaw", "pitch", "panX", "panY", "dolly"];
const GRAB_THRESHOLD = 6;

interface TrackedPointer {
  x: number;
  y: number;
  startX: number;
  startY: number;
}

function applyPose(el: HTMLElement, pose: ScenePose) {
  el.style.setProperty("--hud-yaw", pose.yaw.toFixed(4));
  el.style.setProperty("--hud-pitch", pose.pitch.toFixed(4));
  el.style.setProperty("--hud-pan-x", `${pose.panX.toFixed(2)}px`);
  el.style.setProperty("--hud-pan-y", `${pose.panY.toFixed(2)}px`);
  el.style.setProperty("--hud-dolly", `${pose.dolly.toFixed(2)}px`);
  el.style.setProperty("--hud-px", (pose.yaw / SCENE_LIMITS.yaw).toFixed(4));
  el.style.setProperty("--hud-py", (pose.pitch / SCENE_LIMITS.pitch).toFixed(4));
}

function isElement(target: EventTarget | null): target is Element {
  return target instanceof Element;
}

function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

/** Surfaces that must keep native pointer behavior (controls, embed, splitters). */
function isBlockedTarget(target: EventTarget | null) {
  if (!isElement(target)) return true;
  if (target.closest("[data-scene-grab]")) return false;
  if (target.closest("[data-no-scene-drag]")) return true;
  if (target.closest('[role="dialog"]')) return true;
  if (target.closest('[role="separator"]')) return true;
  if (target.closest("iframe")) return true;
  if (target.closest("input, textarea, select, option, label")) return true;
  if (target.closest("button, a")) return true;
  if (target.closest("[data-scroll]")) return true;
  return false;
}

function setDragging(root: HTMLElement, on: boolean) {
  if (on) {
    root.setAttribute("data-hud-dragging", "1");
    root.style.setProperty("--hud-dragging", "1");
  } else {
    root.removeAttribute("data-hud-dragging");
    root.style.setProperty("--hud-dragging", "0");
  }
}

/**
 * Shared CSS 3D camera for the HUD. Writes pose to CSS variables (no React re-renders).
 * Drag HUD chrome / cards / empty space to orbit; Shift or middle-button pans;
 * pinch / ctrl+wheel dollies. Last pose is kept with a short spring settle.
 */
export function useHudScene(
  rootRef: RefObject<HTMLElement | null>,
  stageRef: RefObject<HTMLElement | null>,
  reducedMotion: boolean,
) {
  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;

    applyPose(root, ZERO_POSE);

    const current: ScenePose = { ...ZERO_POSE };
    const target: ScenePose = { ...ZERO_POSE };
    const lerp = reducedMotion ? 1 : 0.16;
    const inertiaGain = reducedMotion ? 0 : SCENE_SENS.inertia;

    let raf = 0;
    let grabbing = false;
    let mode: "orbit" | "pan" | "pinch" = "orbit";
    let lastX = 0;
    let lastY = 0;
    let vx = 0;
    let vy = 0;
    let pinchDist = 0;
    let pinchMidX = 0;
    let pinchMidY = 0;
    const pointers = new Map<number, TrackedPointer>();

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const commitTarget = () => {
      copyPose(clampPose(target), target);
      kick();
    };

    const tick = () => {
      let live = grabbing;
      for (const key of POSE_KEYS) {
        const next = current[key] + (target[key] - current[key]) * lerp;
        if (Math.abs(target[key] - current[key]) > 0.02) live = true;
        current[key] = next;
      }
      applyPose(root, current);
      raf = live ? requestAnimationFrame(tick) : 0;
    };

    const capture = (event: PointerEvent) => {
      try {
        if (!stage.hasPointerCapture(event.pointerId)) {
          stage.setPointerCapture(event.pointerId);
        }
      } catch {
        /* unsupported */
      }
    };

    const startGrab = (event: PointerEvent) => {
      if (grabbing) {
        capture(event);
        return;
      }
      grabbing = true;
      setDragging(root, true);
      capture(event);
      kick();
    };

    const stopGrab = () => {
      grabbing = false;
      setDragging(root, false);
      kick();
    };

    const applyDelta = (dx: number, dy: number, pan: boolean) => {
      if (pan) {
        target.panX += dx * SCENE_SENS.pan;
        target.panY += dy * SCENE_SENS.pan;
      } else {
        target.yaw -= dx * SCENE_SENS.yaw;
        target.pitch -= dy * SCENE_SENS.pitch;
      }
      commitTarget();
    };

    const syncPinch = () => {
      if (pointers.size !== 2) {
        pinchDist = 0;
        return;
      }
      const [a, b] = [...pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      if (pinchDist > 0) {
        target.dolly += (dist - pinchDist) * SCENE_SENS.dollyPinch;
        target.panX += midX - pinchMidX;
        target.panY += midY - pinchMidY;
        commitTarget();
      }
      pinchDist = dist;
      pinchMidX = midX;
      pinchMidY = midY;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button === 2) return;
      const fromGrip = isElement(event.target) && Boolean(event.target.closest("[data-scene-grab]"));
      if (!fromGrip && isBlockedTarget(event.target) && event.button !== 1) return;

      pointers.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
        startX: event.clientX,
        startY: event.clientY,
      });
      lastX = event.clientX;
      lastY = event.clientY;
      vx = 0;
      vy = 0;

      if (pointers.size >= 2) {
        mode = "pinch";
        startGrab(event);
        syncPinch();
        return;
      }

      mode = event.button === 1 || event.shiftKey ? "pan" : "orbit";
      if (event.button === 1) {
        event.preventDefault();
        startGrab(event);
        return;
      }
      if (fromGrip) {
        if (event.pointerType === "touch") event.preventDefault();
        const grip = event.target instanceof Element ? event.target.closest("[data-scene-grab]") : null;
        if (grip instanceof HTMLElement) grip.focus({ preventScroll: true });
        startGrab(event);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      const tracked = pointers.get(event.pointerId);
      if (!tracked) return;

      tracked.x = event.clientX;
      tracked.y = event.clientY;

      if (pointers.size >= 2) {
        mode = "pinch";
        startGrab(event);
        syncPinch();
        return;
      }

      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;

      if (!grabbing) {
        const traveled = Math.hypot(tracked.x - tracked.startX, tracked.y - tracked.startY);
        if (traveled < GRAB_THRESHOLD) return;
        startGrab(event);
      }

      vx = vx * 0.62 + dx * 0.38;
      vy = vy * 0.62 + dy * 0.38;
      applyDelta(dx, dy, mode === "pan" || event.shiftKey);
    };

    const releasePointer = (event: PointerEvent) => {
      if (!pointers.has(event.pointerId)) return;
      pointers.delete(event.pointerId);

      if (stage.hasPointerCapture(event.pointerId)) {
        try {
          stage.releasePointerCapture(event.pointerId);
        } catch {
          /* already released */
        }
      }

      if (pointers.size === 1) {
        const remain = [...pointers.values()][0];
        lastX = remain.x;
        lastY = remain.y;
        mode = "orbit";
        pinchDist = 0;
        return;
      }

      if (pointers.size === 0) {
        if (grabbing && inertiaGain > 0 && mode === "orbit") {
          target.yaw -= vx * inertiaGain;
          target.pitch -= vy * inertiaGain;
        }
        commitTarget();
        stopGrab();
        pinchDist = 0;
        vx = 0;
        vy = 0;
      }
    };

    const onWheel = (event: WheelEvent) => {
      if (isTyping(event.target)) return;
      if (isElement(event.target) && event.target.closest("iframe, [role='dialog']")) return;
      const overScroll = isElement(event.target) && event.target.closest("[data-scroll]");
      if (overScroll && !event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      target.dolly -= event.deltaY * SCENE_SENS.dollyWheel;
      commitTarget();
    };

    const onDblClick = (event: MouseEvent) => {
      if (!isElement(event.target) || !event.target.closest("[data-scene-grab]")) return;
      copyPose(ZERO_POSE, target);
      commitTarget();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTyping(event.target)) return;
      if (!(event.target instanceof Element) || !event.target.closest("[data-scene-grab]")) return;
      const step = event.shiftKey ? 4 : 2.4;
      switch (event.key) {
        case "ArrowLeft":
          target.yaw += step;
          break;
        case "ArrowRight":
          target.yaw -= step;
          break;
        case "ArrowUp":
          target.pitch += step;
          break;
        case "ArrowDown":
          target.pitch -= step;
          break;
        case "+":
        case "=":
          target.dolly += 22;
          break;
        case "-":
        case "_":
          target.dolly -= 22;
          break;
        case "0":
        case "Home":
          copyPose(ZERO_POSE, target);
          break;
        default:
          return;
      }
      event.preventDefault();
      commitTarget();
    };

    const onLostCapture = () => {
      if (pointers.size === 0) return;
      pointers.clear();
      pinchDist = 0;
      stopGrab();
    };

    stage.addEventListener("pointerdown", onPointerDown);
    stage.addEventListener("pointermove", onPointerMove);
    stage.addEventListener("pointerup", releasePointer);
    stage.addEventListener("pointercancel", releasePointer);
    stage.addEventListener("lostpointercapture", onLostCapture);
    stage.addEventListener("wheel", onWheel, { passive: false });
    stage.addEventListener("dblclick", onDblClick);
    stage.addEventListener("keydown", onKeyDown);

    return () => {
      stage.removeEventListener("pointerdown", onPointerDown);
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerup", releasePointer);
      stage.removeEventListener("pointercancel", releasePointer);
      stage.removeEventListener("lostpointercapture", onLostCapture);
      stage.removeEventListener("wheel", onWheel);
      stage.removeEventListener("dblclick", onDblClick);
      stage.removeEventListener("keydown", onKeyDown);
      if (raf) cancelAnimationFrame(raf);
      setDragging(root, false);
      applyPose(root, ZERO_POSE);
    };
  }, [reducedMotion, rootRef, stageRef]);
}
