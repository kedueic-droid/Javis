import { EMBED_DIM, OWNER_THRESHOLD } from "./vector";

export const VOICEPRINT_MODEL_ID = "redimnet-b2-vox2";
const DB_NAME = "jarvis.voiceprint";
const STORE = "profile";
const KEY = "owner";

export interface VoiceProfile {
  version: 1;
  modelId: string;
  createdAt: string;
  dim: number;
  embeddings: number[][];
  centroid: number[];
  threshold: number;
}

function validProfile(value: unknown): value is VoiceProfile {
  if (!value || typeof value !== "object") return false;
  const profile = value as VoiceProfile;
  if (profile.version !== 1 || profile.modelId !== VOICEPRINT_MODEL_ID) return false;
  if (profile.dim !== EMBED_DIM) return false;
  if (!Array.isArray(profile.centroid) || profile.centroid.length !== EMBED_DIM) return false;
  if (!Array.isArray(profile.embeddings) || profile.embeddings.length < 3) return false;
  if (typeof profile.threshold !== "number" || !Number.isFinite(profile.threshold)) return false;
  return profile.embeddings.every((row) => Array.isArray(row) && row.length === EMBED_DIM);
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("無法開啟聲紋資料庫"));
  });
}

export async function loadVoiceProfile(): Promise<VoiceProfile | null> {
  const db = await openDb();
  try {
    const profile = await new Promise<unknown>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const request = tx.objectStore(STORE).get(KEY);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error ?? new Error("無法讀取聲紋"));
    });
    if (!validProfile(profile)) return null;
    return {
      ...profile,
      threshold: Math.max(profile.threshold, OWNER_THRESHOLD),
    };
  } finally {
    db.close();
  }
}

export async function saveVoiceProfile(profile: VoiceProfile): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(profile, KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("無法儲存聲紋"));
    });
  } finally {
    db.close();
  }
}

export async function clearVoiceProfile(): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("無法清除聲紋"));
    });
  } finally {
    db.close();
  }
}
