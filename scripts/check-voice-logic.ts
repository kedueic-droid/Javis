import { interpretUtterance, type VoiceContext } from "../src/lib/jarvisVoice";
import { assessEnrollment, cosine, l2normalize, OWNER_THRESHOLD, passesOwnerGate } from "../src/lib/speaker/vector";
import { prepareSpeech } from "../src/lib/speaker/audio";

const ctx: VoiceContext = {
  apps: [
    { id: "health-check-report-app", name: "健檢業績儀表板", enabled: true, url: "https://example.test" },
    { id: "sales-weekly-report", name: "健檢業績週報", enabled: true, url: "http://localhost:3080" },
    { id: "sky-island", name: "空島 Sky Island", enabled: true, url: "http://localhost:3000" },
    { id: "labreport-firebase-deploy", name: "檢驗報告數位工作台", enabled: false, url: "" },
  ],
  fleet: [
    { id: "10b5b176-3aa6-4729-be99-850e6ef0b2ac", name: "策略長", role: "指揮", mission: "整合優先序" },
    { id: "d28d6c9c-2c84-4c94-80f4-fb84a14a52c3", name: "空島執行長", role: "空島", mission: "待命／依使用者指派" },
  ],
  greetingTitle: "早安，長官",
  clock: "09:30:00",
};

function assert(cond: boolean, message: string) {
  if (!cond) throw new Error(message);
}

const openWeekly = interpretUtterance("開啟週報", ctx);
assert(openWeekly.action.type === "open-app" && openWeekly.action.appId === "sales-weekly-report", "open weekly");

const island = interpretUtterance("開啟空島", ctx);
assert(island.action.type === "open-app" && island.action.appId === "sky-island", "open sky island app");

const ceo = interpretUtterance("開啟空島執行長", ctx);
assert(ceo.action.type === "open-fleet", "open fleet ceo");

const fleet = interpretUtterance("艦隊概況", ctx);
assert(fleet.action.type === "none" && fleet.reply.includes("策略長"), "fleet summary");

const stranger = interpretUtterance("今天天氣真好", ctx);
assert(stranger.action.type === "none", "fallback");

const mute = interpretUtterance("關閉語音", ctx);
assert(mute.action.type === "mute", "mute");

const close = interpretUtterance("關閉", ctx);
assert(close.action.type === "close", "close");

const help = interpretUtterance("說明", ctx);
assert(help.reply.includes("艦隊"), "help");

const a = l2normalize([1, 0, 0]);
const b = l2normalize([0, 1, 0]);
const c = l2normalize([1, 0.1, 0]);
assert(cosine(a, a) > 0.99, "self cosine");
assert(passesOwnerGate(0.73), "owner passes");
assert(!passesOwnerGate(0.34), "impostor fails");
assert(OWNER_THRESHOLD === 0.5, "threshold");
const bad = assessEnrollment([a, b, c]);
assert(!bad.ok, "inconsistent enrollment rejected");
const good = assessEnrollment([a, l2normalize([1, 0.02, 0]), l2normalize([0.98, 0, 0.01])]);
assert(good.ok, "consistent enrollment accepted");

const quiet = prepareSpeech(new Float32Array(16000));
assert(!quiet.ok && quiet.reason === "quiet", "quiet audio");
const tone = new Float32Array(16000 * 2);
for (let i = 0; i < tone.length; i++) tone[i] = Math.sin(i / 8) * 0.2;
const speech = prepareSpeech(tone);
assert(speech.ok, "speech kept");

console.log("voice logic ok");
