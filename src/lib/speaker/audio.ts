export const TARGET_RATE = 16000;
export const MIN_SPEECH_SECONDS = 1;
export const MAX_SPEECH_SECONDS = 8;
export const MIN_RMS = 0.008;

export function resampleLinear(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate || input.length === 0) return input;
  const outLen = Math.max(1, Math.round((input.length * toRate) / fromRate));
  const out = new Float32Array(outLen);
  const scale = (input.length - 1) / Math.max(1, outLen - 1);
  for (let i = 0; i < outLen; i++) {
    const x = i * scale;
    const i0 = Math.floor(x);
    const i1 = Math.min(input.length - 1, i0 + 1);
    const t = x - i0;
    out[i] = input[i0] * (1 - t) + input[i1] * t;
  }
  return out;
}

export function frameRms(samples: Float32Array, offset: number, length: number): number {
  const end = Math.min(samples.length, offset + length);
  if (end <= offset) return 0;
  let sum = 0;
  for (let i = offset; i < end; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / (end - offset));
}

export function rmsOf(samples: Float32Array): number {
  return frameRms(samples, 0, samples.length);
}

export type PreparedSpeech =
  | { ok: true; samples: Float32Array; seconds: number; rms: number }
  | { ok: false; reason: "short" | "quiet" };

/** Drop leading and trailing silence, then cap length for the embedding model. */
export function prepareSpeech(samples: Float32Array, sampleRate = TARGET_RATE): PreparedSpeech {
  if (samples.length === 0) return { ok: false, reason: "short" };
  const frame = Math.max(1, Math.floor(sampleRate * 0.02));
  const gate = 0.012;
  let start = 0;
  let end = samples.length;
  let found = false;
  for (let i = 0; i + frame <= samples.length; i += frame) {
    if (frameRms(samples, i, frame) >= gate) {
      start = i;
      found = true;
      break;
    }
  }
  if (!found) return { ok: false, reason: "quiet" };
  for (let i = samples.length - frame; i > start; i -= frame) {
    if (frameRms(samples, i, frame) >= gate) {
      end = Math.min(samples.length, i + frame);
      break;
    }
  }
  const pad = Math.floor(sampleRate * 0.08);
  start = Math.max(0, start - pad);
  end = Math.min(samples.length, end + pad);
  let trimmed = samples.subarray(start, end);
  const max = Math.floor(sampleRate * MAX_SPEECH_SECONDS);
  if (trimmed.length > max) trimmed = trimmed.subarray(0, max);
  const copy = new Float32Array(trimmed.length);
  copy.set(trimmed);
  const seconds = copy.length / sampleRate;
  const rms = rmsOf(copy);
  if (rms < MIN_RMS) return { ok: false, reason: "quiet" };
  if (seconds < MIN_SPEECH_SECONDS) return { ok: false, reason: "short" };
  return { ok: true, samples: copy, seconds, rms };
}
