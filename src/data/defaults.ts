import type { AppModule, PortalSettings } from "../types";

export const STORAGE_KEY = "jarvis.portal.v1";
export const STORAGE_VERSION = 1 as const;

export const DEFAULT_SETTINGS: PortalSettings = {
  skipBoot: false,
  soundEnabled: false,
  openMode: "tab",
};

export const DEFAULT_APPS: AppModule[] = [
  {
    id: "health-check-report-app",
    name: "健檢業績儀表板",
    description:
      "GM、經理與業務專用的業績總覽。支援 Excel 上傳、權限分層與圖表分析。",
    stack: "React · Vite · Tailwind · Firebase",
    url: "http://localhost:5173",
    defaultUrl: "http://localhost:5173",
    icon: "dashboard",
    enabled: true,
    builtin: true,
    repoHint: "health-check-report-app",
  },
  {
    id: "sales-weekly-report",
    name: "健檢業績週報",
    description:
      "多週目標對照、圖表與 PDF 輸出的週報工作台。預設埠 3080，避開 Next.js。",
    stack: "Express · EJS · SQLite",
    url: "http://localhost:3080",
    defaultUrl: "http://localhost:3080",
    icon: "weekly",
    enabled: true,
    builtin: true,
    repoHint: "sales-weekly-report",
  },
  {
    id: "sky-island",
    name: "空島 Sky Island",
    description: "以 MapLibre 呈現台灣空域航跡與飛行視覺化的 Next.js 應用。",
    stack: "Next.js · MapLibre",
    url: "http://localhost:3000",
    defaultUrl: "http://localhost:3000",
    icon: "island",
    enabled: true,
    builtin: true,
    repoHint: "Fly island / sky-island",
  },
  {
    id: "labreport-firebase-deploy",
    name: "檢驗報告數位工作台",
    description:
      "檢驗報告數位化作業空間。請在設定中填入 Firebase Hosting 網址。",
    stack: "Firebase Hosting · Static",
    url: "",
    defaultUrl: "",
    icon: "lab",
    enabled: true,
    builtin: true,
    repoHint: "labreport-firebase-deploy",
  },
  {
    id: "checkup-package-tool",
    name: "健檢方案組套工具",
    description: "Streamlit 方案組套與套裝 HTML 工具，用於組出健檢方案。",
    stack: "Streamlit · Python",
    url: "http://localhost:8501",
    defaultUrl: "http://localhost:8501",
    icon: "package",
    enabled: true,
    builtin: true,
    repoHint: "app.py + package HTML/tools",
  },
];

export const SUGGESTED_PORTS = [
  { name: "J.A.R.V.I.S. 指揮中心", port: "5200" },
  { name: "健檢業績儀表板", port: "5173" },
  { name: "空島 Sky Island", port: "3000" },
  { name: "健檢業績週報", port: "3080" },
  { name: "健檢方案組套工具", port: "8501" },
];
