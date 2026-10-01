export type AppStatus = "online" | "standby" | "unconfigured" | "disabled";
export type IconKey =
  | "dashboard"
  | "weekly"
  | "island"
  | "lab"
  | "package"
  | "hex"
  | "radar"
  | "shield";

export type OpenMode = "tab" | "embed";

export interface AppModule {
  id: string;
  name: string;
  description: string;
  stack: string;
  url: string;
  defaultUrl: string;
  icon: IconKey;
  enabled: boolean;
  builtin: boolean;
  repoHint: string;
}

export interface PortalSettings {
  skipBoot: boolean;
  soundEnabled: boolean;
  openMode: OpenMode;
}

export interface PortalExport {
  version: 1;
  exportedAt: string;
  apps: AppModule[];
  settings: PortalSettings;
}

export interface ToastMessage {
  id: string;
  text: string;
  tone: "info" | "ok" | "warn";
}

export type Overlay = "none" | "settings" | "palette";

export interface FleetAgent {
  id: string;
  name: string;
  role: string;
  defaultMission: string;
}

export type FleetCommandStatus = "pending" | "sent" | "result";

export interface FleetCommand {
  id: string;
  agentId: string;
  agentName: string;
  text: string;
  status: FleetCommandStatus;
  createdAt: string;
}
