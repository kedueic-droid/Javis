import type { AppModule } from "../types";

interface EmbedStageProps {
  app: AppModule;
  shieldPointer?: boolean;
  onClose: () => void;
  onOpenTab: (app: AppModule) => void;
}

export function EmbedStage({ app, shieldPointer, onClose, onOpenTab }: EmbedStageProps) {
  return (
    <section
      className="embed-stage panel flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
      aria-label={`${app.name} 內嵌舞台`}
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-cyan-400/20 px-3 py-2.5 md:px-4">
        <div className="min-w-0 flex-1">
          <p className="font-hud text-[10px] tracking-[0.3em] text-cyan-400/80">EMBEDDED STAGE</p>
          <h2 className="truncate text-base text-cyan-50">{app.name}</h2>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenTab(app)}
            className="border border-cyan-400/40 px-3 py-1.5 text-sm text-cyan-100 hover:bg-cyan-400/10"
          >
            外部開啟
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-cyan-200 hover:text-white"
          >
            關閉
          </button>
        </div>
      </header>

      <div className="border-b border-amber-300/25 bg-amber-300/8 px-3 py-2 text-xs leading-relaxed text-amber-100/90 md:text-sm">
        部分應用（尤其是本機開發伺服器或設有 X-Frame-Options 的站台）會阻擋 iframe 嵌入。若畫面空白，請按「外部開啟」；系統不會自動另開分頁。
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden bg-black/70" data-no-scene-drag>
        {app.url ? (
          <iframe
            title={app.name}
            src={app.url}
            className="h-full w-full bg-black"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        ) : (
          <p className="p-8 text-center text-cyan-200/70">尚未設定目標網址。</p>
        )}
        {shieldPointer && (
          <div className="absolute inset-0 z-10 cursor-col-resize bg-transparent" aria-hidden="true" />
        )}
      </div>
    </section>
  );
}
