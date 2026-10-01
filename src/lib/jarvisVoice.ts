export interface VoiceApp {
  id: string;
  name: string;
  enabled: boolean;
  url: string;
}

export interface VoiceAgent {
  id: string;
  name: string;
  role: string;
  mission: string;
}

export interface VoiceContext {
  apps: VoiceApp[];
  fleet: VoiceAgent[];
  greetingTitle: string;
  clock: string;
}

export type VoiceAction =
  | { type: "none" }
  | { type: "open-app"; appId: string }
  | { type: "open-fleet"; agentId: string }
  | { type: "open-settings" }
  | { type: "open-palette" }
  | { type: "close" }
  | { type: "mute" }
  | { type: "unmute" };

export interface VoiceTurn {
  reply: string;
  action: VoiceAction;
}

const APP_ALIASES: Record<string, string[]> = {
  "health-check-report-app": ["健檢業績儀表板", "業績儀表板", "儀表板"],
  "sales-weekly-report": ["健檢業績週報", "業績週報", "週報"],
  "sky-island": ["空島", "sky island", "skyisland"],
  "labreport-firebase-deploy": ["檢驗報告數位工作台", "檢驗報告", "檢驗工作台"],
  "checkup-package-tool": ["健檢方案組套工具", "組套工具", "方案組套", "組套"],
};

const FLEET_ALIASES: Record<string, string[]> = {
  "10b5b176-3aa6-4729-be99-850e6ef0b2ac": ["策略長"],
  "533bb107-dc42-4b81-83c1-6b43c70c9994": ["搬家執行長", "搬家"],
  "f5330c39-00a7-4bc1-9ec1-19f30b953662": ["陪病日執行長", "陪病日", "陪病"],
  "90196e5e-2f2a-470a-9ce2-41ce672461fd": ["商務長"],
  "7d8eec2d-9548-4344-b6f3-1eaf8fcea2bd": ["業務副總"],
  "fd1076b6-0970-49b4-a764-b64a63d1a8cd": ["產品長"],
  "d28d6c9c-2c84-4c94-80f4-fb84a14a52c3": ["空島執行長"],
};

export function normalizeUtterance(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/周報/g, "週報")
    .replace(/[\s，。！？、,.!?'"「」『』（）()：:；;～~\-]/g, "");
}

function includesTerm(utterance: string, term: string): boolean {
  const needle = normalizeUtterance(term);
  return needle.length >= 2 && utterance.includes(needle);
}

function matchScore(utterance: string, labels: string[]): number {
  let best = 0;
  for (const label of labels) {
    const needle = normalizeUtterance(label);
    if (needle.length >= 2 && utterance.includes(needle)) best = Math.max(best, needle.length);
  }
  return best;
}

interface TargetHit {
  kind: "app" | "fleet";
  id: string;
  label: string;
  score: number;
  enabled: boolean;
  url: string;
}

function collectTargets(utterance: string, ctx: VoiceContext): TargetHit[] {
  const hits: TargetHit[] = [];
  for (const app of ctx.apps) {
    const score = matchScore(utterance, [app.name, ...(APP_ALIASES[app.id] ?? [])]);
    if (score > 0) {
      hits.push({ kind: "app", id: app.id, label: app.name, score, enabled: app.enabled, url: app.url });
    }
  }
  for (const agent of ctx.fleet) {
    const score = matchScore(utterance, [agent.name, ...(FLEET_ALIASES[agent.id] ?? [])]);
    if (score > 0) {
      hits.push({ kind: "fleet", id: agent.id, label: agent.name, score, enabled: true, url: "bridge" });
    }
  }
  hits.sort((a, b) => b.score - a.score || a.label.length - b.label.length);
  return hits;
}

function fleetSummary(ctx: VoiceContext): string {
  const names = ctx.fleet.map((agent) => agent.name).join("、");
  const active = ctx.fleet.filter((agent) => agent.mission && !agent.mission.includes("待命"));
  const missions = active
    .slice(0, 3)
    .map((agent) => `${agent.name}目前是${agent.mission}`)
    .join("。");
  const tail = missions ? `${missions}。` : "其餘任務維持待命。";
  return `AI 艦隊共 ${ctx.fleet.length} 名在線：${names}。${tail}要橋接某一位，請說開啟加上職稱。`;
}

function moduleSummary(ctx: VoiceContext): string {
  const ready = ctx.apps.filter((app) => app.enabled && app.url.trim());
  if (ready.length === 0) return "目前沒有可投影的模組。可以先到設定補上網址。";
  return `已登錄 ${ctx.apps.length} 個模組，${ready.length} 個可立即投影：${ready.map((app) => app.name).join("、")}。`;
}

export function interpretUtterance(raw: string, ctx: VoiceContext): VoiceTurn {
  const text = raw.trim();
  const utterance = normalizeUtterance(text);
  if (!utterance) {
    return { reply: "我沒有聽清楚，請再說一次。", action: { type: "none" } };
  }

  if (includesTerm(utterance, "取消靜音") || includesTerm(utterance, "恢復語音") || utterance === "開啟語音") {
    return { reply: "語音播報已恢復。", action: { type: "unmute" } };
  }
  if (
    includesTerm(utterance, "關閉語音") ||
    includesTerm(utterance, "語音靜音") ||
    utterance === "靜音" ||
    utterance === "不要說話"
  ) {
    return { reply: "語音播報先關掉。需要時跟我說恢復語音。", action: { type: "mute" } };
  }

  if (/(說明|幫助|你能做什麼|你可以做什麼|怎麼用|如何使用|help)/.test(utterance)) {
    return {
      reply: "長官，我可以開啟模組、報告 AI 艦隊、告訴你時間，或打開設定。例如：開啟週報、艦隊概況、現在幾點。",
      action: { type: "none" },
    };
  }

  if (/(現在幾點|幾點了|現在時間|報時|什麼時間)/.test(utterance)) {
    return { reply: `現在是 ${ctx.clock}。${ctx.greetingTitle}。`, action: { type: "none" } };
  }

  if (/(艦隊概況|艦隊狀態|總結艦隊|摘要艦隊|有哪些代理人|代理人有誰|艦隊報告|ai艦隊)/.test(utterance) || utterance === "艦隊") {
    return { reply: fleetSummary(ctx), action: { type: "none" } };
  }

  if (/(系統狀態|模組狀態|有哪些模組|有哪些應用|應用清單|模組清單)/.test(utterance)) {
    return { reply: moduleSummary(ctx), action: { type: "none" } };
  }

  if (/^(你好|哈囉|哈啰|嗨|hi|hello|早安|午安|晚安|賈維斯|jarvis|在嗎|你在嗎|嘿|早)$/.test(utterance)) {
    return {
      reply: `${ctx.greetingTitle}。我是 J.A.R.V.I.S.，鐵人指揮中心在線。請下指令。`,
      action: { type: "none" },
    };
  }

  if (utterance === "設定" || /(開啟設定|打開設定|系統設定|設定面板)/.test(utterance)) {
    return { reply: "設定面板打開了。", action: { type: "open-settings" } };
  }

  if (/(指令監視台|開啟指令|打開指令|命令面板)/.test(utterance)) {
    return { reply: "指令監視台準備好了。", action: { type: "open-palette" } };
  }

  if (/(關閉面板|關閉舞台|回到總覽|回到星系|返回星系)/.test(utterance) || utterance === "關閉" || utterance === "回去" || utterance === "返回") {
    return { reply: "好的，我先把目前的面板收起來。", action: { type: "close" } };
  }

  const hits = collectTargets(utterance, ctx);
  const top = hits[0];
  if (top) {
    const second = hits[1];
    const hasOpen = /(開啟|打開|開一下|投影|啟動|進入|載入|切換到|切到)/.test(utterance);
    const tight = utterance.length <= top.score + 6;
    if (second && second.score === top.score) {
      return {
        reply: `你是指${top.label}，還是${second.label}？請說得更明確一點。`,
        action: { type: "none" },
      };
    }
    if (hasOpen || tight) {
      if (top.kind === "fleet") {
        return { reply: `正在為你橋接${top.label}。`, action: { type: "open-fleet", agentId: top.id } };
      }
      if (!top.enabled || !top.url.trim()) {
        return {
          reply: `「${top.label}」還沒有可用網址，我先打開設定。`,
          action: { type: "open-app", appId: top.id },
        };
      }
      return { reply: `正在投影${top.label}。`, action: { type: "open-app", appId: top.id } };
    }
  }

  return {
    reply: "我聽到了，但還沒對上指令。你可以說「說明」，或直接講模組名稱。",
    action: { type: "none" },
  };
}
