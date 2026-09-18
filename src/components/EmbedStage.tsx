import type { AppModule } from "../types";

interface EmbedStageProps {
  app: AppModule;
  onClose: () => void;
  onOpenTab: (app: AppModule) => void;
}

export function EmbedStage({ app, onClose, onOpenTab }: EmbedStageProps) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#02060c]/95 p-3 md:p-5" role="dialog" aria-label={`${app.name} 內嵌檢視`}>
      <div className="panel mb-3 flex flex-wrap items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="font-hud text-[10px] tracking-[0.3em] text-cyan-400/80">EMBEDDED VIEW</p>
          <h2 className="truncate text-base text-cyan-50">{app.name}</h2>
        </div>
        <button
          type="button"
          onClick={() => onOpenTab(app)}
          className="border border-cyan-400/40 px-3 py-1.5 text-sm text-cyan-100"
        >
          改以新分頁開啟
        </button>
        <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm text-cyan-200">
          關閉
        </button>
      </div>
      <div className="mb-3 border border-amber-300/30 bg-amber-300/8 px-4 py-2 text-sm text-amber-100/90">
        部分應用（尤其是本機開發伺服器或設有 X-Frame-Options 的站台）會阻擋 iframe 嵌入。若畫面空白，請改以新分頁開啟。
      </div>
      <div className="panel min-h-0 flex-1 overflow-hidden">
        {app.url ? (
          <iframe
            title={app.name}
            src={app.url}
            className="h-full min-h-[60vh] w-full bg-black"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        ) : (
          <p className="p-8 text-center text-cyan-200/70">尚未設定目標網址。</p>
        )}
      </div>
    </div>
  );
}
