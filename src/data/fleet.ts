import type { FleetAgent } from "../types";

export const FLEET_GROUP_LABEL = "AI 艦隊";

export const FLEET_SIDEBAR_HINT = "在 Grok Bot 側邊欄開啟同名代理人";

export const FLEET_NOTES_KEY = "jarvis.fleet.notes.v1";
export const FLEET_QUEUE_KEY = "jarvis.fleet.queue.v1";

const STANDBY_MISSION = "待命／依使用者指派";

export const FLEET_AGENTS: FleetAgent[] = [
  {
    id: "10b5b176-3aa6-4729-be99-850e6ef0b2ac",
    name: "策略長",
    role: "產品策略、辦法與優先序協調（指揮）",
    defaultMission: "JARVIS 整合與產品優先序",
  },
  {
    id: "533bb107-dc42-4b81-83c1-6b43c70c9994",
    name: "搬家執行長",
    role: "地址搬家 App＋行政下一站",
    defaultMission: "行政下一站 v1",
  },
  {
    id: "f5330c39-00a7-4bc1-9ec1-19f30b953662",
    name: "陪病日執行長",
    role: "陪病日 PWA（臺大醫院總院）",
    defaultMission: "臺大總院 MVP 上線",
  },
  {
    id: "90196e5e-2f2a-470a-9ce2-41ce672461fd",
    name: "商務長",
    role: "業績／獎金／商業數字",
    defaultMission: "業績獎金制度",
  },
  {
    id: "7d8eec2d-9548-4344-b6f3-1eaf8fcea2bd",
    name: "業務副總",
    role: "業務相關支援",
    defaultMission: STANDBY_MISSION,
  },
  {
    id: "fd1076b6-0970-49b4-a764-b64a63d1a8cd",
    name: "產品長",
    role: "產品相關",
    defaultMission: STANDBY_MISSION,
  },
  {
    id: "d28d6c9c-2c84-4c94-80f4-fb84a14a52c3",
    name: "空島執行長",
    role: "空島／重活執行",
    defaultMission: STANDBY_MISSION,
  },
];

export function fleetDeepLink(agentId: string): string {
  return `grokbot://app/v1/agent?id=${agentId}`;
}

export function findFleetAgent(id: string): FleetAgent | undefined {
  return FLEET_AGENTS.find((agent) => agent.id === id);
}
