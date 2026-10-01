import { useCallback, useEffect, useRef, useState } from "react";
import type { VoiceAction, VoiceContext } from "../lib/jarvisVoice";
import { interpretUtterance } from "../lib/jarvisVoice";
import { prepareSpeech } from "../lib/speaker/audio";
import type { MicCapture } from "../lib/speaker/capture";
import { micSupported, openMicCapture } from "../lib/speaker/capture";
import { embedSpeech } from "../lib/speaker/embedder";
import { ENROLL_PHRASES, REJECTION_LINE, RESET_CHALLENGE } from "../lib/speaker/phrases";
import {
  clearVoiceProfile,
  loadVoiceProfile,
  saveVoiceProfile,
  VOICEPRINT_MODEL_ID,
  type VoiceProfile,
} from "../lib/speaker/profileStore";
import { assessEnrollment, cosine, EMBED_DIM, OWNER_THRESHOLD, passesOwnerGate } from "../lib/speaker/vector";
import {
  cancelSpeech,
  createRecognition,
  readVoiceMuted,
  recognitionSupported,
  speakText,
  synthesisSupported,
  warmVoices,
  writeVoiceMuted,
  type BrowserRecognition,
} from "../lib/speech";

export type VoicePhase =
  | "loading-profile"
  | "needs-enroll"
  | "enrolling"
  | "idle"
  | "listening"
  | "verifying"
  | "processing"
  | "speaking"
  | "rejected";

export type PresenceMode = "idle" | "listen" | "speak";

type EnrollKind = "create" | "replace" | "erase";

interface EnrollDraft {
  kind: EnrollKind;
  step: number;
  embeddings: Float32Array[];
}

export function useJarvisVoice(options: {
  context: VoiceContext;
  onAction: (action: VoiceAction) => string | void;
  onLog?: (line: string) => void;
  onPresence?: (mode: PresenceMode) => void;
}) {
  const contextRef = useRef(options.context);
  const onActionRef = useRef(options.onAction);
  const onLogRef = useRef(options.onLog);
  const onPresenceRef = useRef(options.onPresence);
  contextRef.current = options.context;
  onActionRef.current = options.onAction;
  onLogRef.current = options.onLog;
  onPresenceRef.current = options.onPresence;

  const [phase, setPhase] = useState<VoicePhase>("loading-profile");
  const [profile, setProfile] = useState<VoiceProfile | null>(null);
  const [muted, setMuted] = useState(() => readVoiceMuted());
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [notice, setNotice] = useState("");
  const [detail, setDetail] = useState("");
  const [enroll, setEnroll] = useState<EnrollDraft | null>(null);
  const [recording, setRecording] = useState(false);
  const [level, setLevel] = useState(0);
  const [modelProgress, setModelProgress] = useState<number | null>(null);

  const phaseRef = useRef(phase);
  const profileRef = useRef(profile);
  const mutedRef = useRef(muted);
  const enrollRef = useRef(enroll);
  phaseRef.current = phase;
  profileRef.current = profile;
  mutedRef.current = muted;
  enrollRef.current = enroll;

  const captureRef = useRef<MicCapture | null>(null);
  const recognitionRef = useRef<BrowserRecognition | null>(null);
  const levelTimer = useRef(0);
  const vadTimer = useRef(0);
  const listenGen = useRef(0);
  const speechMs = useRef(0);
  const phraseLock = useRef(false);

  const sttOk = recognitionSupported();
  const ttsOk = synthesisSupported();
  const micOk = micSupported();

  const clearTimers = useCallback(() => {
    window.clearInterval(levelTimer.current);
    window.clearInterval(vadTimer.current);
    levelTimer.current = 0;
    vadTimer.current = 0;
  }, []);

  const releaseCapture = useCallback(
    async (keepAudio: boolean) => {
      clearTimers();
      const capture = captureRef.current;
      captureRef.current = null;
      setLevel(0);
      setRecording(false);
      if (!capture) return null;
      if (!keepAudio) {
        capture.cancel();
        return null;
      }
      return capture.finish();
    },
    [clearTimers],
  );

  const say = useCallback((text: string, next: VoicePhase) => {
    setReply(text);
    const canSpeak = !mutedRef.current && ttsOk;
    if (!canSpeak) {
      setPhase(next);
      return;
    }
    setPhase("speaking");
    speakText(text, {
      muted: false,
      onend: () => setPhase(next),
    });
  }, [ttsOk]);

  const reject = useCallback(
    (detailText: string, next: VoicePhase) => {
      setReply(REJECTION_LINE);
      setDetail(detailText);
      setNotice("");
      onLogRef.current?.("聲紋未通過");
      say(REJECTION_LINE, next);
    },
    [say],
  );

  useEffect(() => {
    warmVoices();
    const onVoices = () => warmVoices();
    if (ttsOk) window.speechSynthesis.addEventListener("voiceschanged", onVoices);
    let cancelled = false;
    void loadVoiceProfile()
      .then((stored) => {
        if (cancelled) return;
        setProfile(stored);
        setPhase(stored ? "idle" : "needs-enroll");
      })
      .catch(() => {
        if (cancelled) return;
        setNotice("無法讀取本機聲紋。語音指令不會執行。");
        setPhase("needs-enroll");
      });
    return () => {
      cancelled = true;
      listenGen.current += 1;
      clearTimers();
      captureRef.current?.cancel();
      captureRef.current = null;
      recognitionRef.current?.abort();
      recognitionRef.current = null;
      cancelSpeech();
      if (ttsOk) window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
    };
  }, [clearTimers, ttsOk]);

  useEffect(() => {
    const mode: PresenceMode =
      phase === "listening" || phase === "verifying" ? "listen" : phase === "speaking" ? "speak" : "idle";
    onPresenceRef.current?.(mode);
  }, [phase]);

  const idlePhase = useCallback((): VoicePhase => (profileRef.current ? "idle" : "needs-enroll"), []);

  const beginRecording = useCallback(async () => {
    setNotice("");
    setDetail("");
    const capture = await openMicCapture();
    captureRef.current = capture;
    setRecording(true);
    speechMs.current = 0;
    levelTimer.current = window.setInterval(() => {
      setLevel(Math.min(1, capture.level() * 8));
    }, 80);
    return capture;
  }, []);

  const finishPhrase = useCallback(async () => {
    if (phraseLock.current) return;
    phraseLock.current = true;
    window.clearInterval(vadTimer.current);
    try {
    const samples = await releaseCapture(true);
    const draft = enrollRef.current;
    if (!draft) return;
    if (!samples) {
      setNotice("沒有收到聲音，請再錄一次。");
      setPhase("enrolling");
      return;
    }
    const prepared = prepareSpeech(samples);
    if (!prepared.ok) {
      setNotice(prepared.reason === "quiet" ? "聲音太小，請靠近麥克風再錄一次。" : "這段太短，請把整句說完。");
      setPhase("enrolling");
      return;
    }
    setNotice("正在建立聲紋，模型只需載入一次。");
    setPhase("verifying");
      const embedding = await embedSpeech(prepared.samples, (ratio) => setModelProgress(ratio));
      setModelProgress(null);
      if (draft.step < 0) {
        const current = profileRef.current;
        if (!current) {
          setNotice("找不到既有聲紋。");
          setEnroll(null);
          setPhase("needs-enroll");
          return;
        }
        const score = cosine(embedding, current.centroid);
        if (!passesOwnerGate(score, current.threshold)) {
          setEnroll(null);
          reject(`比對分數 ${score.toFixed(2)}，低於門檻 ${current.threshold.toFixed(2)}。已保留原本聲紋。`, "idle");
          return;
        }
        if (draft.kind === "erase") {
          await clearVoiceProfile();
          setProfile(null);
          profileRef.current = null;
          setEnroll(null);
          setTranscript("");
          onLogRef.current?.("聲紋已清除");
          say("聲紋已清除。在重新登錄之前，我不會執行語音指令。", "needs-enroll");
          return;
        }
        const next = { kind: draft.kind, step: 0, embeddings: [] };
        setEnroll(next);
        enrollRef.current = next;
        setNotice("已確認是你。請接著錄三句新的聲紋。");
        setPhase("enrolling");
        return;
      }

      const embeddings = [...draft.embeddings, embedding];
      if (embeddings.length < ENROLL_PHRASES.length) {
        const next = { kind: draft.kind, step: embeddings.length, embeddings };
        setEnroll(next);
        enrollRef.current = next;
        setNotice(`第 ${embeddings.length} 句已錄下。`);
        setPhase("enrolling");
        return;
      }

      const assessment = assessEnrollment(embeddings);
      if (!assessment.ok) {
        const next = { kind: draft.kind, step: 0, embeddings: [] };
        setEnroll(next);
        enrollRef.current = next;
        setNotice(assessment.reason);
        setPhase("enrolling");
        return;
      }
      const stored: VoiceProfile = {
        version: 1,
        modelId: VOICEPRINT_MODEL_ID,
        createdAt: new Date().toISOString(),
        dim: EMBED_DIM,
        embeddings: embeddings.map((vector) => Array.from(vector)),
        centroid: Array.from(assessment.centroid),
        threshold: OWNER_THRESHOLD,
      };
      await saveVoiceProfile(stored);
      setProfile(stored);
      profileRef.current = stored;
      setEnroll(null);
      enrollRef.current = null;
      onLogRef.current?.("主人聲紋登錄完成");
      say("聲紋登錄完成。之後只有你的聲音能下達指令。", "idle");
    } catch (error) {
      setModelProgress(null);
      setNotice(error instanceof Error ? error.message : "聲紋引擎載入失敗。指令不會執行。");
      setPhase("enrolling");
    } finally {
      phraseLock.current = false;
    }
  }, [reject, releaseCapture, say]);

  const startPhraseRecording = useCallback(async () => {
    if (!micOk) {
      setNotice("此環境沒有麥克風。語音功能無法使用，其餘指揮中心仍可操作。");
      return;
    }
    if (recording || phaseRef.current === "verifying" || phaseRef.current === "speaking") return;
    setReply("");
    setDetail("");
    try {
      const capture = await beginRecording();
      let heard = false;
      let silenceMs = 0;
      const started = performance.now();
      vadTimer.current = window.setInterval(() => {
        const rms = capture.level();
        if (rms > 0.02) {
          heard = true;
          speechMs.current += 80;
          silenceMs = 0;
        } else if (heard) {
          silenceMs += 80;
        }
        const elapsed = performance.now() - started;
        if ((heard && speechMs.current > 1300 && silenceMs > 780) || elapsed > 9000) {
          void finishPhrase();
        }
      }, 80);
    } catch (error) {
      setRecording(false);
      const name = error instanceof DOMException ? error.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setNotice("麥克風權限未開啟。請在瀏覽器允許此網站使用麥克風後再試。其餘功能仍可使用。");
      } else if (name === "NotFoundError") {
        setNotice("找不到麥克風。其餘功能仍可使用。");
      } else {
        setNotice("無法啟動麥克風。其餘功能仍可使用。");
      }
    }
  }, [beginRecording, finishPhrase, micOk, recording]);

  const beginEnroll = useCallback((kind: EnrollKind) => {
    cancelSpeech();
    recognitionRef.current?.abort();
    void releaseCapture(false);
    const draft: EnrollDraft = {
      kind,
      step: kind === "create" ? 0 : -1,
      embeddings: [],
    };
    setEnroll(draft);
    enrollRef.current = draft;
    setTranscript("");
    setReply("");
    setDetail("");
    setNotice(kind === "create" ? "請朗讀畫面上的句子。錄完三句才會儲存聲紋。" : "請先朗讀確認句，核對目前聲紋。");
    setPhase("enrolling");
  }, [releaseCapture]);

  const cancelEnroll = useCallback(() => {
    void releaseCapture(false);
    setEnroll(null);
    enrollRef.current = null;
    setNotice("");
    setPhase(idlePhase());
  }, [idlePhase, releaseCapture]);

  const runCommand = useCallback(
    async (gen: number, text: string) => {
      if (listenGen.current !== gen) return;
      const samples = await releaseCapture(true);
      if (listenGen.current !== gen) return;
      const spoken = text.trim();
      setTranscript(spoken);
      if (!spoken) {
        setNotice("沒有聽清楚，請再按一次語音。");
        setPhase(idlePhase());
        return;
      }
      const current = profileRef.current;
      if (!current) {
        setNotice("尚未登錄主人聲紋，語音指令不會執行。");
        setPhase("needs-enroll");
        return;
      }
      if (!samples) {
        setNotice("無法取得聲音樣本，指令已忽略。");
        setPhase("idle");
        return;
      }
      const prepared = prepareSpeech(samples);
      if (!prepared.ok) {
        reject(
          prepared.reason === "quiet" ? "聲音太小，無法比對。指令未執行。" : "聲音太短，無法比對。指令未執行。",
          "idle",
        );
        return;
      }
      setPhase("verifying");
      setNotice("正在比對聲紋…");
      let embedding: Float32Array;
      try {
        embedding = await embedSpeech(prepared.samples, (ratio) => setModelProgress(ratio));
      } catch (error) {
        setModelProgress(null);
        setNotice(error instanceof Error ? `${error.message} 指令已忽略。` : "聲紋引擎無法使用，指令已忽略。");
        setPhase("idle");
        return;
      }
      setModelProgress(null);
      if (listenGen.current !== gen) return;
      const score = cosine(embedding, current.centroid);
      if (!passesOwnerGate(score, current.threshold)) {
        reject(`比對分數 ${score.toFixed(2)}，低於門檻 ${current.threshold.toFixed(2)}。指令未執行。`, "idle");
        return;
      }
      setPhase("processing");
      setNotice("");
      setDetail(`聲紋符合（${score.toFixed(2)}）。`);
      await new Promise((resolve) => window.setTimeout(resolve, 90));
      const turn = interpretUtterance(spoken, contextRef.current);
      onLogRef.current?.(`語音：${spoken}`);
      let line = turn.reply;
      if (turn.action.type === "mute") {
        const override = onActionRef.current(turn.action);
        if (typeof override === "string") line = override;
        setReply(line);
        speakText(line, {
          muted: false,
          onstart: () => setPhase("speaking"),
          onend: () => {
            writeVoiceMuted(true);
            setMuted(true);
            mutedRef.current = true;
            setPhase("idle");
          },
        });
        return;
      }
      if (turn.action.type === "unmute") {
        writeVoiceMuted(false);
        setMuted(false);
        mutedRef.current = false;
      }
      if (turn.action.type !== "none" && turn.action.type !== "unmute") {
        const override = onActionRef.current(turn.action);
        if (typeof override === "string") line = override;
      }
      setReply(line);
      say(line, "idle");
    },
    [idlePhase, reject, releaseCapture, say],
  );

  const stopListen = useCallback(() => {
    listenGen.current += 1;
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    void releaseCapture(false);
    cancelSpeech();
    setPhase(idlePhase());
  }, [idlePhase, releaseCapture]);

  const startListen = useCallback(async () => {
    if (!profileRef.current) {
      setNotice("尚未登錄主人聲紋。請先完成登錄，否則我不會執行任何語音指令。");
      setPhase("needs-enroll");
      return;
    }
    if (!sttOk) {
      setNotice("此瀏覽器不支援語音辨識。請改用桌面版 Chrome 或 Edge。其餘功能仍可使用。");
      return;
    }
    if (!micOk) {
      setNotice("此環境沒有麥克風。其餘功能仍可使用。");
      return;
    }
    if (enrollRef.current) return;
    cancelSpeech();
    const gen = ++listenGen.current;
    setTranscript("");
    setReply("");
    setDetail("");
    setNotice("聆聽中。說完會先核對是不是你的聲音。");
    setPhase("listening");
    const recognition = createRecognition();
    if (!recognition) {
      setNotice("此瀏覽器不支援語音辨識。其餘功能仍可使用。");
      setPhase("idle");
      return;
    }
    recognitionRef.current = recognition;
    const capturePromise = beginRecording();
    let finalText = "";
    let errored = "";
    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const piece = event.results[i]?.[0]?.transcript ?? "";
        if (event.results[i]?.isFinal) finalText += piece;
        else interim += piece;
      }
      setTranscript((finalText + interim).trim());
    };
    recognition.onerror = (event) => {
      errored = event.error;
    };
    recognition.onend = () => {
      void (async () => {
      try {
        await capturePromise;
      } catch {
        return;
      }
      recognitionRef.current = null;
      if (listenGen.current !== gen) return;
      if (errored === "not-allowed" || errored === "service-not-allowed") {
        listenGen.current += 1;
        void releaseCapture(false);
        setNotice("麥克風權限未開啟。請在瀏覽器允許此網站使用麥克風後再試。其餘功能仍可使用。");
        setPhase("idle");
        return;
      }
      if (errored === "network") {
        listenGen.current += 1;
        void releaseCapture(false);
        setNotice("瀏覽器的語音辨識服務暫時連不上。音訊沒有上傳到本站，這次指令不會執行。");
        setPhase("idle");
        return;
      }
      if (!finalText.trim() && (errored === "no-speech" || errored === "aborted")) {
        listenGen.current += 1;
        void releaseCapture(false);
        if (errored === "no-speech") setNotice("沒有聽清楚，請再試一次。");
        setPhase("idle");
        return;
      }
      void runCommand(gen, finalText);
      })();
    };
    try {
      recognition.start();
      await capturePromise;
      if (listenGen.current !== gen) {
        await releaseCapture(false);
      }
    } catch (error) {
      listenGen.current += 1;
      recognition.abort();
      recognitionRef.current = null;
      void capturePromise
        .then((capture) => {
          capture.cancel();
          if (captureRef.current === capture) captureRef.current = null;
          clearTimers();
          setRecording(false);
          setLevel(0);
        })
        .catch(() => undefined);
      const name = error instanceof DOMException ? error.name : "";
      setNotice(
        name === "NotAllowedError" || name === "SecurityError"
          ? "麥克風權限未開啟。請在瀏覽器允許此網站使用麥克風後再試。其餘功能仍可使用。"
          : "無法啟動麥克風。其餘功能仍可使用。",
      );
      setPhase("idle");
    }
  }, [beginRecording, clearTimers, micOk, releaseCapture, runCommand, sttOk]);

  const toggleListen = useCallback(() => {
    if (phaseRef.current === "listening") {
      recognitionRef.current?.stop();
      return;
    }
    if (phaseRef.current === "enrolling" && enrollRef.current) {
      if (recording) void finishPhrase();
      else void startPhraseRecording();
      return;
    }
    if (phaseRef.current === "verifying" || phaseRef.current === "processing" || phaseRef.current === "speaking") {
      return;
    }
    void startListen();
  }, [finishPhrase, recording, startListen, startPhraseRecording]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.isComposing) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key.toLowerCase() !== "v") return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();
      toggleListen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleListen]);

  const toggleMute = useCallback(() => {
    setMuted((current) => {
      const next = !current;
      mutedRef.current = next;
      writeVoiceMuted(next);
      if (next) cancelSpeech();
      return next;
    });
  }, []);

  const prompt =
    enroll?.step === -1
      ? RESET_CHALLENGE
      : enroll
        ? ENROLL_PHRASES[enroll.step] ?? ENROLL_PHRASES[0]
        : "";

  return {
    phase,
    enrolled: Boolean(profile),
    enrolledAt: profile?.createdAt ?? "",
    muted,
    transcript,
    reply,
    notice,
    detail,
    enroll,
    prompt,
    phrases: ENROLL_PHRASES,
    recording,
    level,
    modelProgress,
    sttOk,
    ttsOk,
    micOk,
    beginEnroll,
    cancelEnroll,
    startPhraseRecording,
    finishPhrase,
    toggleListen,
    stopListen,
    toggleMute,
  };
}
