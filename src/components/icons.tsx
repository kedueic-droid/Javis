import type { IconKey } from "../types";

interface IconProps {
  className?: string;
}

export function IconDashboard({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        d="M4 13h5v7H4zM10 4h5v16h-5zM16 9h4v11h-4z"
      />
    </svg>
  );
}

export function IconWeekly({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path fill="none" stroke="currentColor" strokeWidth="1.4" d="M8 3v4M16 3v4M4 10h16" />
      <path fill="currentColor" d="M8 13h2v2H8zM12 13h2v2h-2zM16 13h2v2h-2zM8 17h8v1.4H8z" />
    </svg>
  );
}

export function IconIsland({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        d="M3 17c2.5-1.2 5-1.8 9-1.8S18.5 15.8 21 17"
      />
      <path fill="none" stroke="currentColor" strokeWidth="1.4" d="M4 14c2-3 4.2-5 8-6 2 2.2 4 4 6 6" />
      <path fill="none" stroke="currentColor" strokeWidth="1.4" d="M5 10l13-5-3 6" />
    </svg>
  );
}

export function IconLab({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        d="M9 3h6M10 3v6l-5 9h14l-5-9V3"
      />
      <path fill="none" stroke="currentColor" strokeWidth="1.4" d="M8.5 14h7" />
    </svg>
  );
}

export function IconPackage({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        d="M12 3 21 8v8l-9 5-9-5V8l9-5z"
      />
      <path fill="none" stroke="currentColor" strokeWidth="1.4" d="M12 12v9M12 12 3 8M12 12l9-4" />
    </svg>
  );
}

export function IconHex({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        d="M7 4h10l5 8-5 8H7L2 12l5-8z"
      />
    </svg>
  );
}

export function IconRadar({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path fill="none" stroke="currentColor" strokeWidth="1.4" d="M12 12 18 7" />
    </svg>
  );
}

export function IconShield({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        d="M12 3 19 6v6c0 4.2-2.8 7.4-7 9-4.2-1.6-7-4.8-7-9V6l7-3z"
      />
    </svg>
  );
}

const MAP = {
  dashboard: IconDashboard,
  weekly: IconWeekly,
  island: IconIsland,
  lab: IconLab,
  package: IconPackage,
  hex: IconHex,
  radar: IconRadar,
  shield: IconShield,
};

export const ICON_OPTIONS: { key: IconKey; label: string }[] = [
  { key: "dashboard", label: "儀表" },
  { key: "weekly", label: "週報" },
  { key: "island", label: "空島" },
  { key: "lab", label: "檢驗" },
  { key: "package", label: "組套" },
  { key: "hex", label: "六角" },
  { key: "radar", label: "雷達" },
  { key: "shield", label: "護盾" },
];

export function AppIcon({ name, className }: { name: IconKey; className?: string }) {
  const Cmp = MAP[name] ?? IconHex;
  return <Cmp className={className} />;
}
