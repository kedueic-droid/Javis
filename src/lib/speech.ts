const MUTE_KEY = "jarvis.voice.muted.v1";

interface RecognitionAlternative {
  transcript: string;
}

interface RecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: RecognitionAlternative;
}

export interface RecognitionResultEvent {
  readonly resultIndex: number;
  readonly results: ArrayLike<RecognitionResult>;
}

export interface RecognitionErrorEvent {
  readonly error: string;
}

export interface BrowserRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

type RecognitionCtor = new () => BrowserRecognition;

export function recognitionSupported(): boolean {
  return getRecognitionCtor() !== null;
}

export function synthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const host = window as Window & {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return host.SpeechRecognition ?? host.webkitSpeechRecognition ?? null;
}

export function createRecognition(): BrowserRecognition | null {
  const Ctor = getRecognitionCtor();
  if (!Ctor) return null;
  const recognition = new Ctor();
  recognition.lang = "zh-TW";
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  return recognition;
}

export function readVoiceMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeVoiceMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    /* private mode */
  }
}

function voiceRank(voice: SpeechSynthesisVoice): number {
  const lang = voice.lang.toLowerCase();
  const name = voice.name.toLowerCase();
  if (lang === "zh-tw" || lang.startsWith("zh-tw")) return 0;
  if (name.includes("taiwan") || name.includes("台灣") || name.includes("繁體") || name.includes("繁中")) return 1;
  if (lang.startsWith("zh-hant") || lang.includes("cmn-hant")) return 1;
  if (lang.startsWith("zh")) return 3;
  return 9;
}

export function pickZhTwVoice(): SpeechSynthesisVoice | null {
  if (!synthesisSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  const ranked = voices.filter((voice) => voiceRank(voice) < 9).sort((a, b) => voiceRank(a) - voiceRank(b));
  return ranked[0] ?? null;
}

export function warmVoices(): void {
  if (!synthesisSupported()) return;
  window.speechSynthesis.getVoices();
}

export function speakText(
  text: string,
  options: { muted: boolean; onstart?: () => void; onend?: () => void },
): void {
  if (!synthesisSupported() || options.muted || !text.trim()) {
    options.onend?.();
    return;
  }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "zh-TW";
  utter.rate = 1.02;
  utter.pitch = 0.96;
  const voice = pickZhTwVoice();
  if (voice) utter.voice = voice;

  let finished = false;
  let timer = 0;
  const done = () => {
    if (finished) return;
    finished = true;
    window.clearTimeout(timer);
    options.onend?.();
  };
  utter.onstart = () => options.onstart?.();
  utter.onend = done;
  utter.onerror = done;
  timer = window.setTimeout(done, Math.min(20000, 2800 + text.length * 160));
  window.setTimeout(() => {
    if (!finished) window.speechSynthesis.speak(utter);
  }, 40);
}

export function cancelSpeech(): void {
  if (synthesisSupported()) window.speechSynthesis.cancel();
}
