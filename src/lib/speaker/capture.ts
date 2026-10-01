import { resampleLinear, TARGET_RATE } from "./audio";

export interface MicCapture {
  level: () => number;
  finish: () => Promise<Float32Array>;
  cancel: () => void;
}

export function micSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
}

export async function openMicCapture(): Promise<MicCapture> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });
  const ctx = new AudioContext();
  if (ctx.state === "suspended") await ctx.resume();
  const source = ctx.createMediaStreamSource(stream);
  const processor = ctx.createScriptProcessor(4096, 1, 1);
  const mute = ctx.createGain();
  mute.gain.value = 0;
  const rate = ctx.sampleRate || 48000;
  const chunks: Float32Array[] = [];
  let kept = 0;
  const maxSamples = rate * 15;
  let lastRms = 0;
  let closed = false;

  processor.onaudioprocess = (event) => {
    const data = event.inputBuffer.getChannelData(0);
    const copy = new Float32Array(data.length);
    copy.set(data);
    chunks.push(copy);
    kept += copy.length;
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
    lastRms = Math.sqrt(sum / Math.max(1, data.length));
    while (kept > maxSamples && chunks.length > 1) {
      const dropped = chunks.shift();
      if (dropped) kept -= dropped.length;
    }
  };

  source.connect(processor);
  processor.connect(mute);
  mute.connect(ctx.destination);

  const cleanup = () => {
    if (closed) return;
    closed = true;
    processor.onaudioprocess = null;
    try {
      source.disconnect();
      processor.disconnect();
      mute.disconnect();
    } catch {
      /* already disconnected */
    }
    for (const track of stream.getTracks()) track.stop();
    void ctx.close();
  };

  return {
    level: () => lastRms,
    cancel: cleanup,
    finish: async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 140));
      const merged = new Float32Array(kept);
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }
      cleanup();
      return resampleLinear(merged, rate, TARGET_RATE);
    },
  };
}
