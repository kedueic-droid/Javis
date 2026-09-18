# J.A.R.V.I.S. 鐵人指揮中心

Jarvis 風格的 **AI 應用入口 / 指揮中心**。原始碼放在 GitHub，正式環境以 **Firebase Hosting** 靜態部署。

這是一個不需後端的 SPA：Vite + React + TypeScript + Tailwind CSS。五個既有應用以啟動器卡片接入，不會改寫那些專案的原始碼。

## 本機啟動指揮中心

```bash
npm install
npm run dev
```

瀏覽器開啟 [http://localhost:5200](http://localhost:5200)（刻意避開儀表板的 5173 與 Next.js 的 3000）。

```bash
npm run build      # 輸出到 dist/
npm run preview    # 預覽正式建置
```

## 把卡片指到本機應用

指揮中心只負責 **啟動**，請先在各專案目錄自行跑起服務，再到本畫面「設定」填入網址。

| 應用 | 建議埠 | 預設網址 | 技術棧 |
| --- | --- | --- | --- |
| 健檢業績儀表板 | `5173` | `http://localhost:5173` | React + Vite + Tailwind + Firebase |
| 健檢業績週報 | `3080` | `http://localhost:3080` | Express + EJS + SQLite |
| 空島 Sky Island | `3000` | `http://localhost:3000` | Next.js + MapLibre |
| 檢驗報告數位工作台 | （Firebase） | 空白，請填 Hosting 網址 | 靜態 Firebase Hosting |
| 健檢方案組套工具 | `8501` | `http://localhost:8501` | Streamlit `app.py` |
| **本指揮中心** | `5200` | `http://localhost:5200` | Vite + React |

週報請使用 **3080**，避免與空島的 Next.js 搶 3000。

點卡片「啟動」預設在 **指揮中心同頁內嵌舞台** 開啟，可用拖曳把手調整啟動器 / 內嵌區 / 側欄大小（尺寸會記在 localStorage）。「外部開啟」才會另開分頁。若對方站台設了 `X-Frame-Options`，iframe 可能空白，請用舞台上的「外部開啟」，系統不會自動跳新分頁。

## 新增第六個（或更多）應用

不需改程式：

1. 按右上角「設定」，或快捷鍵 `Cmd/Ctrl+K`、`/` 開啟指令監視台後選「新增應用」。
2. 填名稱、說明、網址、技術棧與圖示。
3. 「加入啟動器」後立即出現在 HUD，並寫入此瀏覽器的 `localStorage`。

亦可「匯出 JSON」備份，或「匯入 JSON」還原。`重設為預設` 會清掉自訂項目並還原五個內建模組。

## Firebase Hosting 部署

1. 安裝 CLI：`npm install -g firebase-tools`
2. 編輯 [`.firebaserc`](.firebaserc)，把 `your-firebase-project-id` 換成你的專案 ID。
3. 登入並（若尚未建立）關聯專案：

```bash
firebase login
firebase use --add
```

4. 建置並部署：

```bash
npm run build
firebase deploy
```

[`firebase.json`](firebase.json) 已將 Hosting 的 `public` 設為 `dist`，並把所有路徑 rewrite 到 `index.html`，SPA 深層連結可直接開。

原始碼繼續用 Git 推到 GitHub；Hosting 只上傳 `dist` 靜態檔。

## 操作說明

- 開機動畫約 2–3 秒，可按「略過」；設定可永久略過。
- 開機提示音使用 Web Audio，**預設靜音**。
- `Esc` 先關閉設定或指令監視台；若沒有浮層則關閉內嵌舞台。
- 系統會依時段顯示中文問候（早安 / 午安 / 晚安 / 深夜協議）。
- `prefers-reduced-motion` 會關閉掃描線、粒子連線、旋轉環與開機動畫，但仍保留 HUD 深度層。
- 手機改為單欄卡片；寬螢幕為左欄模組清單 + 中央環形 HUD；內嵌時改為可拖曳分割版面。

## 品牌

產品介面使用 **J.A.R.V.I.S. / 鐵人指揮中心**。此 repo 名稱為 `Javis`，不影響畫面品牌。
