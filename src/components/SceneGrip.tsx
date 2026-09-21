import { useRef, type PointerEvent as ReactPointerEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { dispatchSolarCam } from "../lib/solarCamera";

export function SceneGrip() {
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const pointerId = useRef<number | null>(null);

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button === 2) return;
    dragging.current = true;
    pointerId.current = event.pointerId;
    last.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragging.current || event.pointerId !== pointerId.current) return;
    const dx = event.clientX - last.current.x;
    const dy = event.clientY - last.current.y;
    last.current = { x: event.clientX, y: event.clientY };
    if (event.shiftKey || event.buttons === 4) {
      dispatchSolarCam({ type: "pan", dx, dy });
    } else {
      dispatchSolarCam({ type: "orbit", dx, dy });
    }
  };

  const endDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerId !== pointerId.current) return;
    dragging.current = false;
    pointerId.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* already released */
    }
  };

  const onWheel = (event: React.WheelEvent<HTMLButtonElement>) => {
    event.preventDefault();
    dispatchSolarCam({ type: "dolly", delta: -event.deltaY });
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    const step = event.shiftKey ? 18 : 10;
    switch (event.key) {
      case "ArrowLeft":
        dispatchSolarCam({ type: "orbit", dx: step, dy: 0 });
        break;
      case "ArrowRight":
        dispatchSolarCam({ type: "orbit", dx: -step, dy: 0 });
        break;
      case "ArrowUp":
        dispatchSolarCam({ type: "orbit", dx: 0, dy: step });
        break;
      case "ArrowDown":
        dispatchSolarCam({ type: "orbit", dx: 0, dy: -step });
        break;
      case "+":
      case "=":
        dispatchSolarCam({ type: "dolly", delta: 180 });
        break;
      case "-":
      case "_":
        dispatchSolarCam({ type: "dolly", delta: -180 });
        break;
      case "0":
      case "Home":
        dispatchSolarCam({ type: "reset" });
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  return (
    <button
      type="button"
      data-scene-grab
      className="scene-grip"
      title="拖曳以環繞星系，Shift 拖曳平移，滾輪縮放；雙擊或按 0 重設"
      aria-label="操控場景：拖曳環繞太陽系，雙擊重設"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onWheel={onWheel}
      onDoubleClick={() => dispatchSolarCam({ type: "reset" })}
      onKeyDown={onKeyDown}
    >
      <span className="scene-grip-reticle" aria-hidden="true" />
      <span className="font-hud tracking-[0.22em]">操控場景</span>
    </button>
  );
}
