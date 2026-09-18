import { cn } from "../lib/cn";

interface ResizeHandleProps {
  orientation: "vertical" | "horizontal";
  label: string;
  onDrag: (clientX: number, clientY: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onNudge?: (deltaPx: number) => void;
}

export function ResizeHandle({
  orientation,
  label,
  onDrag,
  onDragStart,
  onDragEnd,
  onNudge,
}: ResizeHandleProps) {
  const vertical = orientation === "vertical";

  return (
    <div
      role="separator"
      aria-orientation={vertical ? "vertical" : "horizontal"}
      aria-label={label}
      title={label}
      tabIndex={0}
      className={cn(
        "group relative z-20 shrink-0 touch-none select-none",
        vertical ? "w-3 cursor-col-resize" : "h-3 cursor-row-resize",
      )}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        onDragStart?.();
        onDrag(event.clientX, event.clientY);
      }}
      onPointerMove={(event) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
        onDrag(event.clientX, event.clientY);
      }}
      onPointerUp={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        onDragEnd?.();
      }}
      onPointerCancel={() => onDragEnd?.()}
      onKeyDown={(event) => {
        if (!onNudge) return;
        if (vertical && event.key === "ArrowLeft") {
          event.preventDefault();
          onNudge(-24);
        } else if (vertical && event.key === "ArrowRight") {
          event.preventDefault();
          onNudge(24);
        } else if (!vertical && event.key === "ArrowUp") {
          event.preventDefault();
          onNudge(-24);
        } else if (!vertical && event.key === "ArrowDown") {
          event.preventDefault();
          onNudge(24);
        }
      }}
    >
      <span
        className={cn(
          "pointer-events-none absolute bg-cyan-300/40 transition",
          "group-hover:bg-cyan-200 group-focus-visible:bg-cyan-100",
          "shadow-[0_0_14px_rgba(0,229,255,0.7)]",
          vertical
            ? "top-1/2 left-1/2 h-20 w-px -translate-x-1/2 -translate-y-1/2"
            : "top-1/2 left-1/2 h-px w-20 -translate-x-1/2 -translate-y-1/2",
        )}
      />
      <span
        className={cn(
          "pointer-events-none absolute border-cyan-300/70",
          vertical
            ? "top-1/2 left-1/2 h-7 w-2.5 -translate-x-1/2 -translate-y-1/2 border-y border-l"
            : "top-1/2 left-1/2 h-2.5 w-7 -translate-x-1/2 -translate-y-1/2 border-x border-t",
        )}
      />
    </div>
  );
}
