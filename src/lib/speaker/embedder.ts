import { l2normalize } from "./vector";

const MODEL_URL = `${import.meta.env.BASE_URL}models/redimnet-b2-vox2.onnx`;
const MODEL_SHA256 = "a7586b34c8db1bbf32c64efc2b269be54f66787e50320c4472614bbe95218a81";

export type ModelProgress = (ratio: number) => void;

type OrtModule = typeof import("onnxruntime-web/wasm");
type Session = import("onnxruntime-common").InferenceSession;

let ortPromise: Promise<OrtModule> | null = null;
let sessionPromise: Promise<Session> | null = null;

async function loadOrt(): Promise<OrtModule> {
  if (!ortPromise) {
    ortPromise = import("onnxruntime-web/wasm").then((ort) => {
      ort.env.wasm.numThreads = 1;
      ort.env.wasm.simd = true;
      ort.env.wasm.wasmPaths = `${import.meta.env.BASE_URL}ort/`;
      return ort;
    });
  }
  return ortPromise;
}

function hex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let out = "";
  for (const byte of bytes) out += byte.toString(16).padStart(2, "0");
  return out;
}

async function fetchModel(onProgress?: ModelProgress): Promise<Uint8Array> {
  const response = await fetch(MODEL_URL);
  if (!response.ok) throw new Error(`聲紋模型下載失敗（${response.status}）`);
  const total = Number(response.headers.get("content-length") || 0);
  if (!response.body) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    onProgress?.(1);
    await assertModel(bytes);
    return bytes;
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      received += value.byteLength;
      if (total > 0) onProgress?.(Math.min(0.98, received / total));
    }
  }
  const buffer = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  onProgress?.(1);
  await assertModel(buffer);
  return buffer;
}

async function assertModel(bytes: Uint8Array): Promise<void> {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  const digest = await crypto.subtle.digest("SHA-256", copy);
  if (hex(digest) !== MODEL_SHA256) {
    throw new Error("聲紋模型檔案不正確，已停止載入。");
  }
}

export function loadSpeakerSession(onProgress?: ModelProgress): Promise<Session> {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const ort = await loadOrt();
      const bytes = await fetchModel(onProgress);
      return ort.InferenceSession.create(bytes, {
        executionProviders: ["wasm"],
        graphOptimizationLevel: "all",
      });
    })().catch((error: unknown) => {
      sessionPromise = null;
      throw error;
    });
  }
  return sessionPromise;
}

export async function embedSpeech(samples: Float32Array, onProgress?: ModelProgress): Promise<Float32Array> {
  const session = await loadSpeakerSession(onProgress);
  const ort = await loadOrt();
  const audio = samples.slice();
  const tensor = new ort.Tensor("float32", audio, [1, 1, audio.length]);
  const inputName = session.inputNames[0] ?? "audio";
  const output = await session.run({ [inputName]: tensor });
  const outputName = session.outputNames[0] ?? "embs";
  const value = output[outputName];
  if (!value) throw new Error("聲紋模型沒有輸出。");
  return l2normalize(value.data as Float32Array);
}
