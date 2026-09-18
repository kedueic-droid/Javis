/** Shared 3D HUD camera pose. Units: degrees for yaw/pitch, CSS pixels for pan/dolly. */
export interface ScenePose {
  yaw: number;
  pitch: number;
  panX: number;
  panY: number;
  dolly: number;
}

export const ZERO_POSE: ScenePose = {
  yaw: 0,
  pitch: 0,
  panX: 0,
  panY: 0,
  dolly: 0,
};

export const SCENE_LIMITS = {
  yaw: 38,
  pitch: 22,
  pan: 140,
  dollyMin: -80,
  dollyMax: 170,
} as const;

export const SCENE_SENS = {
  yaw: 0.14,
  pitch: 0.1,
  pan: 1,
  dollyWheel: 0.38,
  dollyPinch: 0.9,
  inertia: 0.85,
} as const;

export function clampPose(pose: ScenePose): ScenePose {
  const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
  return {
    yaw: clamp(pose.yaw, -SCENE_LIMITS.yaw, SCENE_LIMITS.yaw),
    pitch: clamp(pose.pitch, -SCENE_LIMITS.pitch, SCENE_LIMITS.pitch),
    panX: clamp(pose.panX, -SCENE_LIMITS.pan, SCENE_LIMITS.pan),
    panY: clamp(pose.panY, -SCENE_LIMITS.pan, SCENE_LIMITS.pan),
    dolly: clamp(pose.dolly, SCENE_LIMITS.dollyMin, SCENE_LIMITS.dollyMax),
  };
}

export function copyPose(from: ScenePose, to: ScenePose) {
  to.yaw = from.yaw;
  to.pitch = from.pitch;
  to.panX = from.panX;
  to.panY = from.panY;
  to.dolly = from.dolly;
}
