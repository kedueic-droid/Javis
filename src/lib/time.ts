const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"] as const;

export function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export function formatClock(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function formatDate(date: Date): string {
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}  週${WEEKDAYS[date.getDay()]}`;
}

export function greetingForHour(hour: number): { title: string; line: string } {
  if (hour >= 5 && hour < 11) {
    return {
      title: "早安，長官",
      line: "日間協議已載入。核心系統待命，隨時接受指令。",
    };
  }
  if (hour >= 11 && hour < 17) {
    return {
      title: "午安，長官",
      line: "所有模組維持穩定。需要我幫你開啟哪一個系統？",
    };
  }
  if (hour >= 17 && hour < 22) {
    return {
      title: "晚安，長官",
      line: "黃昏掃描完成。指揮中心持續監控連線狀態。",
    };
  }
  return {
    title: "深夜協議啟動",
    line: "我會守著系統。低功耗模式可用，核心仍保持上線。",
  };
}

export function deriveStatus(url: string, enabled: boolean): "online" | "standby" | "unconfigured" | "disabled" {
  if (!enabled) return "disabled";
  if (!url.trim()) return "unconfigured";
  return "standby";
}

export function statusLabel(status: ReturnType<typeof deriveStatus>): string {
  switch (status) {
    case "disabled":
      return "已停用";
    case "unconfigured":
      return "未設定";
    case "standby":
      return "待命";
    default:
      return "線上";
  }
}
