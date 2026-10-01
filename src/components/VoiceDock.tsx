import type { VoiceAction, VoiceContext } from "../lib/jarvisVoice";
import { useJarvisVoice, type PresenceMode, type VoicePhase } from "../hooks/useJarvisVoice";

interface VoiceDockProps {
  context: VoiceContext;
  onAction: (action: VoiceAction) => string | void;
  onLog?: (line: string) => void;
  onPresence?: (mode: PresenceMode) => void;
}

function phaseLabel(phase: VoicePhase, recording: boolean): string {
  if (recording) return "錄音中";
  switch (phase) {
    case "loading-profile":
      return "確認聲紋";
    case "needs-enroll":
      return "尚未登錄";
    case "enrolling":
      return "登錄聲紋";
    case "listening":
      return "聆聽中";
    case "verifying":
      return "比對聲紋";
    case "processing":
      return "處理中";
    case "speaking":
      return "播報中";
    case "rejected":
      return "已拒絕";
    default:
      return "待命";
  }
}

export function VoiceDock({ context, onAction, onLog, onPresence }: VoiceDockProps) {
  const voice = useJarvisVoice({ context, onAction, onLog, onPresence });
  const busy = voice.phase === "verifying" || voice.phase === "processing" || voice.phase === "speaking";
  const showLog = Boolean(
    voice.transcript ||
      voice.reply ||
      voice.notice ||
      voice.detail ||
      voice.enroll ||
      voice.phase === "needs-enroll" ||
      voice.modelProgress !== null,
  );

  return (
    <section className="jarvis-voice" data-no-scene-drag aria-label="J.A.R.V.I.S. 語音">
      {showLog && (
        <div className="panel jarvis-voice-card" aria-live="polite">
          <p className="font-hud text-[10px] tracking-[0.28em] text-cyan-300/80">VOICE LINK</p>
          {voice.enroll && (
            <div className="mt-2">
              <p className="text-sm text-cyan-50">
                {voice.enroll.step < 0
                  ? "確認目前主人"
                  : `登錄 ${Math.min(voice.enroll.step + 1, voice.phrases.length)}/${voice.phrases.length}`}
              </p>
              <p className="mt-2 text-base leading-relaxed text-cyan-50">請朗讀：{voice.prompt}</p>
              <ol className="mt-2 space-y-1 text-xs text-cyan-200/70">
                {voice.phrases.map((phrase, index) => (
                  <li key={phrase} className={index < voice.enroll!.step ? "text-cyan-100" : ""}>
                    {index < (voice.enroll?.step ?? 0) ? "已錄" : index === voice.enroll?.step ? "現在" : "待錄"} · {phrase}
                  </li>
                ))}
              </ol>
            </div>
          )}
          {voice.phase === "needs-enroll" && !voice.enroll && (
            <p className="mt-2 text-sm leading-relaxed text-cyan-50">
              語音指令只接受已登錄的主人聲音。請先朗讀三句短語，聲紋只存在這台瀏覽器。
            </p>
          )}
          {voice.transcript && (
            <p className="mt-2 text-sm text-cyan-100">
              <span className="font-hud mr-2 text-[10px] tracking-[0.2em] text-cyan-400/80">聽到</span>
              {voice.transcript}
            </p>
          )}
          {voice.reply && <p className="mt-2 text-sm leading-relaxed text-cyan-50">{voice.reply}</p>}
          {voice.detail && <p className="mt-1 font-mono text-[11px] text-cyan-200/70">{voice.detail}</p>}
          {voice.notice && <p className="mt-2 text-sm leading-relaxed text-amber-100/90">{voice.notice}</p>}
          {voice.modelProgress !== null && (
            <p className="mt-2 font-mono text-[11px] text-cyan-200/70">
              載入聲紋模型 {Math.round(voice.modelProgress * 100)}%
            </p>
          )}
          {voice.recording && (
            <div className="mt-3 h-1.5 overflow-hidden bg-cyan-400/10" aria-hidden="true">
              <div className="h-full bg-cyan-300" style={{ width: `${Math.round(voice.level * 100)}%` }} />
            </div>
          )}
          {!voice.ttsOk && <p className="mt-2 text-xs text-cyan-200/60">此環境無法朗讀，文字回覆仍會顯示。</p>}
        </div>
      )}

      <div className="jarvis-voice-bar">
        <span className="font-hud text-[10px] tracking-[0.22em] text-cyan-300/80">
          {phaseLabel(voice.phase, voice.recording)}
        </span>
        {voice.enroll ? (
          <>
            <button
              type="button"
              className="jarvis-voice-mic"
              onClick={() => (voice.recording ? void voice.finishPhrase() : void voice.startPhraseRecording())}
              disabled={busy}
            >
              {voice.recording ? "停止並使用這段" : "開始朗讀"}
            </button>
            <button type="button" className="jarvis-voice-ghost" onClick={voice.cancelEnroll}>
              取消
            </button>
          </>
        ) : voice.enrolled ? (
          <>
            <button
              type="button"
              className="jarvis-voice-mic"
              aria-pressed={voice.phase === "listening"}
              disabled={!voice.sttOk || busy}
              onClick={voice.toggleListen}
            >
              {voice.phase === "listening" ? "停止聆聽" : "語音"}
              <span className="kbd">V</span>
            </button>
            <button type="button" className="jarvis-voice-ghost" aria-pressed={voice.muted} onClick={voice.toggleMute}>
              {voice.muted ? "取消靜音" : "靜音"}
            </button>
            <button type="button" className="jarvis-voice-ghost" disabled={busy} onClick={() => voice.beginEnroll("replace")}>
              重新登錄
            </button>
            <button type="button" className="jarvis-voice-ghost" disabled={busy} onClick={() => voice.beginEnroll("erase")}>
              清除聲紋
            </button>
          </>
        ) : (
          <button
            type="button"
            className="jarvis-voice-mic"
            disabled={voice.phase === "loading-profile"}
            onClick={() => voice.beginEnroll("create")}
          >
            開始登錄聲紋
          </button>
        )}
      </div>
    </section>
  );
}
