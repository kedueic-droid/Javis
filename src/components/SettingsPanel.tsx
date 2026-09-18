import { useEffect, useRef, useState } from "react";
import type { AppModule, IconKey, PortalSettings } from "../types";
import { ICON_OPTIONS } from "./icons";

interface SettingsPanelProps {
  apps: AppModule[];
  settings: PortalSettings;
  focusAdd?: boolean;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<AppModule>) => void;
  onRemove: (id: string) => void;
  onAdd: (input: {
    name: string;
    description: string;
    stack: string;
    url: string;
    icon: IconKey;
  }) => void;
  onSettings: (patch: Partial<PortalSettings>) => void;
  onReset: () => void;
  onExport: () => void;
  onImport: (raw: string) => void;
}

export function SettingsPanel({
  apps,
  settings,
  focusAdd,
  onClose,
  onUpdate,
  onRemove,
  onAdd,
  onSettings,
  onReset,
  onExport,
  onImport,
}: SettingsPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const addNameRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    stack: "",
    url: "",
    icon: "hex" as IconKey,
  });

  useEffect(() => {
    if (focusAdd) addNameRef.current?.focus();
  }, [focusAdd]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/55" role="dialog" aria-label="系統設定">
      <button type="button" className="h-full flex-1 cursor-default" aria-label="關閉設定" onClick={onClose} />
      <aside className="panel flex h-full w-full max-w-xl flex-col overflow-hidden border-l border-cyan-400/30 bg-[#041018]/96">
        <header className="flex items-center justify-between border-b border-cyan-400/20 px-5 py-4">
          <div>
            <p className="font-hud text-[10px] tracking-[0.35em] text-cyan-400/80">CONFIGURATION</p>
            <h2 className="mt-1 text-lg text-cyan-50">系統設定</h2>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-cyan-200 hover:text-white">
            關閉
          </button>
        </header>

        <div className="flex-1 space-y-8 overflow-y-auto px-5 py-5">
          <section>
            <h3 className="font-hud mb-3 text-[11px] tracking-[0.28em] text-cyan-300/80">操作偏好</h3>
            <div className="space-y-3 text-sm">
              <label className="flex items-center justify-between gap-4">
                <span>略過開機動畫</span>
                <input
                  type="checkbox"
                  checked={settings.skipBoot}
                  onChange={(e) => onSettings({ skipBoot: e.target.checked })}
                />
              </label>
              <label className="flex items-center justify-between gap-4">
                <span>開機提示音（預設靜音）</span>
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => onSettings({ soundEnabled: e.target.checked })}
                />
              </label>
              <label className="flex items-center justify-between gap-4">
                <span>預設啟動方式</span>
                <select
                  value={settings.openMode}
                  onChange={(e) => onSettings({ openMode: e.target.value as PortalSettings["openMode"] })}
                  className="px-2 py-1"
                >
                  <option value="tab">新分頁</option>
                  <option value="embed">內嵌檢視</option>
                </select>
              </label>
            </div>
          </section>

          <section>
            <h3 className="font-hud mb-3 text-[11px] tracking-[0.28em] text-cyan-300/80">應用模組</h3>
            <div className="space-y-4">
              {apps.map((app) => (
                <div key={app.id} className="border border-cyan-400/20 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-cyan-50">{app.builtin ? "內建模組" : "自訂模組"}</p>
                    <label className="flex items-center gap-2 text-xs text-cyan-200/80">
                      啟用
                      <input
                        type="checkbox"
                        checked={app.enabled}
                        onChange={(e) => onUpdate(app.id, { enabled: e.target.checked })}
                      />
                    </label>
                  </div>
                  <div className="grid gap-2">
                    <input
                      type="text"
                      value={app.name}
                      onChange={(e) => onUpdate(app.id, { name: e.target.value })}
                      aria-label={`${app.name} 名稱`}
                      className="px-2 py-1.5 text-sm"
                    />
                    <textarea
                      value={app.description}
                      onChange={(e) => onUpdate(app.id, { description: e.target.value })}
                      aria-label={`${app.name} 說明`}
                      rows={2}
                      className="px-2 py-1.5 text-sm"
                    />
                    <input
                      type="url"
                      value={app.url}
                      onChange={(e) => onUpdate(app.id, { url: e.target.value })}
                      placeholder="https:// 或 http://localhost:…"
                      aria-label={`${app.name} 網址`}
                      className="px-2 py-1.5 font-mono text-sm"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={app.stack}
                        onChange={(e) => onUpdate(app.id, { stack: e.target.value })}
                        aria-label={`${app.name} 技術棧`}
                        className="px-2 py-1.5 text-sm"
                      />
                      <select
                        value={app.icon}
                        onChange={(e) => onUpdate(app.id, { icon: e.target.value as IconKey })}
                        aria-label={`${app.name} 圖示`}
                        className="px-2 py-1.5 text-sm"
                      >
                        {ICON_OPTIONS.map((opt) => (
                          <option key={opt.key} value={opt.key}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {!app.builtin && (
                      <button
                        type="button"
                        onClick={() => onRemove(app.id)}
                        className="justify-self-start text-xs text-amber-300/90 hover:text-amber-200"
                      >
                        刪除此自訂應用
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="font-hud mb-3 text-[11px] tracking-[0.28em] text-cyan-300/80">新增應用</h3>
            <form
              className="grid gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                onAdd(form);
                setForm({ name: "", description: "", stack: "", url: "", icon: "hex" });
              }}
            >
              <input
                ref={addNameRef}
                required
                type="text"
                placeholder="名稱（例如：內部 Wiki）"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="px-2 py-1.5 text-sm"
              />
              <textarea
                placeholder="簡短說明"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className="px-2 py-1.5 text-sm"
              />
              <input
                type="url"
                placeholder="目標網址"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                className="px-2 py-1.5 font-mono text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="技術棧標記"
                  value={form.stack}
                  onChange={(e) => setForm((f) => ({ ...f, stack: e.target.value }))}
                  className="px-2 py-1.5 text-sm"
                />
                <select
                  value={form.icon}
                  onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value as IconKey }))}
                  className="px-2 py-1.5 text-sm"
                >
                  {ICON_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="mt-1 bg-cyan-400/20 py-2 text-sm text-cyan-50 hover:bg-cyan-400/30">
                加入啟動器
              </button>
            </form>
          </section>

          <section className="space-y-3 pb-8">
            <h3 className="font-hud mb-3 text-[11px] tracking-[0.28em] text-cyan-300/80">資料</h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onExport}
                className="border border-cyan-400/30 px-3 py-1.5 text-sm text-cyan-100"
              >
                匯出 JSON
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="border border-cyan-400/30 px-3 py-1.5 text-sm text-cyan-100"
              >
                匯入 JSON
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  onImport(await file.text());
                }}
              />
              {!confirmReset ? (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="px-3 py-1.5 text-sm text-amber-300"
                >
                  重設為預設
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onReset();
                    setConfirmReset(false);
                  }}
                  className="px-3 py-1.5 text-sm text-amber-200"
                >
                  確認清除本機設定？
                </button>
              )}
            </div>
            <p className="text-xs leading-relaxed text-cyan-200/50">
              所有名稱、說明與網址儲存在此瀏覽器的 localStorage，不會上傳到伺服器。
            </p>
          </section>
        </div>
      </aside>
    </div>
  );
}
