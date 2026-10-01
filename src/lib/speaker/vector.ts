/** Cosine threshold tuned on held-out clips from different speakers. */
export const OWNER_THRESHOLD = 0.5;

/**
 * Enrollment clips are part of their own centroid, so this bar is higher than
 * the verify threshold. It rejects a take that does not match the others.
 */
export const ENROLL_MIN_SELF_SCORE = 0.62;

export const EMBED_DIM = 192;

export function l2normalize(vector: ArrayLike<number>): Float32Array {
  const out = new Float32Array(vector.length);
  let sum = 0;
  for (let i = 0; i < vector.length; i++) sum += vector[i] * vector[i];
  const norm = Math.sqrt(sum);
  if (norm === 0) return out;
  for (let i = 0; i < vector.length; i++) out[i] = vector[i] / norm;
  return out;
}

export function cosine(a: ArrayLike<number>, b: ArrayLike<number>): number {
  const n = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  if (denom === 0) return 0;
  return dot / denom;
}

export function centroidOf(vectors: ArrayLike<number>[]): Float32Array {
  if (vectors.length === 0) return new Float32Array();
  const dim = vectors[0].length;
  const acc = new Float32Array(dim);
  for (const vector of vectors) {
    for (let i = 0; i < dim; i++) acc[i] += vector[i];
  }
  for (let i = 0; i < dim; i++) acc[i] /= vectors.length;
  return l2normalize(acc);
}

export interface EnrollmentAssessment {
  ok: boolean;
  reason: string;
  centroid: Float32Array;
  scores: number[];
}

export function assessEnrollment(embeddings: ArrayLike<number>[]): EnrollmentAssessment {
  if (embeddings.length < 3) {
    return {
      ok: false,
      reason: "需要三段主人聲音才能建立聲紋。",
      centroid: new Float32Array(),
      scores: [],
    };
  }
  const centroid = centroidOf(embeddings);
  const scores = embeddings.map((embedding) => cosine(embedding, centroid));
  const weakest = Math.min(...scores);
  if (weakest < ENROLL_MIN_SELF_SCORE) {
    return {
      ok: false,
      reason: "這幾次聲音不夠一致。請在較安靜的地方，用同樣的音量再錄一次。",
      centroid,
      scores,
    };
  }
  return { ok: true, reason: "", centroid, scores };
}

export function passesOwnerGate(score: number, threshold = OWNER_THRESHOLD): boolean {
  return score >= Math.max(threshold, OWNER_THRESHOLD);
}
