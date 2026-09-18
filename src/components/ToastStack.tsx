import { useEffect } from "react";
import type { ToastMessage } from "../types";

export function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="pointer-events-none fixed bottom-16 left-4 z-50 flex w-[min(90vw,22rem)] flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const id = window.setTimeout(() => onDismiss(toast.id), 3200);
    return () => window.clearTimeout(id);
  }, [onDismiss, toast.id]);

  const tone =
    toast.tone === "ok"
      ? "border-cyan-300/50 text-cyan-50"
      : toast.tone === "warn"
        ? "border-amber-300/50 text-amber-50"
        : "border-blue-300/40 text-cyan-50";

  return (
    <p className={`panel pointer-events-auto px-3 py-2 text-sm ${tone}`}>{toast.text}</p>
  );
}
