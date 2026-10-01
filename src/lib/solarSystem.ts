import type { AppModule, IconKey } from "../types";

export interface PlanetLook {
  color: string;
  emissive: string;
  atmosphere: string;
  roughness: number;
  metalness: number;
  radius: number;
  ring?: { color: string; inner: number; outer: number };
}

export interface PlanetOrbit {
  radius: number;
  speed: number;
  inclination: number;
  omega: number;
  phase: number;
  spin: number;
}

const ICON_LOOKS: Record<IconKey, PlanetLook> = {
  dashboard: {
    color: "#1a8cff",
    emissive: "#062a66",
    atmosphere: "#7ad4ff",
    roughness: 0.42,
    metalness: 0.18,
    radius: 0.42,
  },
  weekly: {
    color: "#e0b13a",
    emissive: "#5c3a08",
    atmosphere: "#ffe18a",
    roughness: 0.5,
    metalness: 0.22,
    radius: 0.36,
  },
  island: {
    color: "#14c8a4",
    emissive: "#053d32",
    atmosphere: "#7dffe0",
    roughness: 0.46,
    metalness: 0.12,
    radius: 0.4,
  },
  lab: {
    color: "#b44aff",
    emissive: "#3a1066",
    atmosphere: "#e4b0ff",
    roughness: 0.38,
    metalness: 0.28,
    radius: 0.34,
  },
  package: {
    color: "#ff6b3d",
    emissive: "#5a1c0a",
    atmosphere: "#ffb089",
    roughness: 0.48,
    metalness: 0.16,
    radius: 0.46,
    ring: { color: "#ffd0a8", inner: 0.58, outer: 0.92 },
  },
  hex: {
    color: "#9eb6c8",
    emissive: "#243240",
    atmosphere: "#d5e8f4",
    roughness: 0.35,
    metalness: 0.45,
    radius: 0.33,
  },
  radar: {
    color: "#3dff7a",
    emissive: "#0a4a28",
    atmosphere: "#a6ffc8",
    roughness: 0.4,
    metalness: 0.2,
    radius: 0.35,
  },
  shield: {
    color: "#4a7dff",
    emissive: "#142048",
    atmosphere: "#a8c4ff",
    roughness: 0.36,
    metalness: 0.4,
    radius: 0.38,
    ring: { color: "#9bb8ff", inner: 0.5, outer: 0.78 },
  },
};

const FALLBACK_LOOK: PlanetLook = {
  color: "#6ec8ff",
  emissive: "#0a3048",
  atmosphere: "#b8ecff",
  roughness: 0.44,
  metalness: 0.2,
  radius: 0.34,
};

export const SUN = {
  radius: 1.22,
  core: "#fff8ee",
  mid: "#9af7ff",
  rim: "#00e5ff",
  glow: "#7af6ff",
} as const;

export function hashHue(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 360;
}

export function lookForApp(app: AppModule): PlanetLook {
  if (app.builtin) return ICON_LOOKS[app.icon] ?? FALLBACK_LOOK;
  const hue = hashHue(app.id);
  const color = `hsl(${hue} 72% 58%)`;
  const emissive = `hsl(${hue} 70% 18%)`;
  const atmosphere = `hsl(${hue} 80% 78%)`;
  return {
    color,
    emissive,
    atmosphere,
    roughness: 0.42,
    metalness: 0.22,
    radius: 0.32 + (hashHue(app.id + "r") % 12) / 80,
  };
}

/** Kepler-ish circular orbit: inner worlds move faster, distinct planes. */
export function orbitForIndex(index: number, total: number): PlanetOrbit {
  const radius = 3.45 + index * (total > 6 ? 1.42 : 1.62);
  const speed = 0.2 / Math.pow(radius / 3.45, 1.45);
  const sign = index % 2 === 0 ? 1 : -1;
  return {
    radius,
    speed,
    inclination: sign * ((7 + index * 2.8) * Math.PI) / 180,
    omega: index * 0.62 + 0.15,
    phase: index * 2.399963,
    spin: 0.35 + (index % 5) * 0.12,
  };
}

const FLEET_LOOKS: PlanetLook[] = [
  {
    color: "#f6d36b",
    emissive: "#6a4a10",
    atmosphere: "#ffe7a8",
    roughness: 0.28,
    metalness: 0.62,
    radius: 0.4,
    ring: { color: "#ffe7a8", inner: 1.45, outer: 2.05 },
  },
  {
    color: "#c9864a",
    emissive: "#4a2c10",
    atmosphere: "#ffd0a4",
    roughness: 0.32,
    metalness: 0.55,
    radius: 0.34,
  },
  {
    color: "#e58aa4",
    emissive: "#5a2038",
    atmosphere: "#ffc4d4",
    roughness: 0.3,
    metalness: 0.5,
    radius: 0.34,
  },
  {
    color: "#b7b15a",
    emissive: "#3e3a10",
    atmosphere: "#efe7a4",
    roughness: 0.34,
    metalness: 0.48,
    radius: 0.33,
  },
  {
    color: "#8d97ea",
    emissive: "#242858",
    atmosphere: "#d5dbff",
    roughness: 0.3,
    metalness: 0.58,
    radius: 0.33,
  },
  {
    color: "#c9a0ff",
    emissive: "#3a2060",
    atmosphere: "#edd9ff",
    roughness: 0.3,
    metalness: 0.52,
    radius: 0.34,
  },
  {
    color: "#7ddec8",
    emissive: "#0e4038",
    atmosphere: "#c8fff0",
    roughness: 0.32,
    metalness: 0.5,
    radius: 0.35,
  },
];

export function lookForFleet(index: number): PlanetLook {
  return FLEET_LOOKS[index] ?? FLEET_LOOKS[index % FLEET_LOOKS.length] ?? FALLBACK_LOOK;
}

/** Outer ribbon shared by the AI fleet, outside the app planets. */
export function orbitForFleet(index: number, count: number, appCount: number): PlanetOrbit {
  const appSpacing = appCount > 6 ? 1.42 : 1.62;
  const appOuter = appCount <= 0 ? 3.45 : 3.45 + Math.max(0, appCount - 1) * appSpacing;
  const total = Math.max(count, 1);
  const spread = index - (total - 1) / 2;
  return {
    radius: appOuter + 2.55,
    speed: 0.052,
    inclination: ((14 + spread * 2.2) * Math.PI) / 180,
    omega: 0.42,
    phase: (index / total) * Math.PI * 2,
    spin: 0.4 + (index % 4) * 0.08,
  };
}

export function defaultCameraDistance(count: number): number {
  const outer = count <= 0 ? 6 : 3.45 + (count - 1) * 1.62 + 1.4;
  return Math.max(14.5, outer * 1.55);
}

export function maxCameraDistance(count: number): number {
  return Math.max(32, defaultCameraDistance(count) * 2.1);
}
