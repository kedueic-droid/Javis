import { FLEET_NOTES_KEY, FLEET_QUEUE_KEY } from "../data/fleet";
import type { FleetCommand, FleetCommandStatus } from "../types";

const STATUSES: FleetCommandStatus[] = ["pending", "sent", "result"];

function isStatus(value: unknown): value is FleetCommandStatus {
  return typeof value === "string" && STATUSES.includes(value as FleetCommandStatus);
}

export function loadFleetNotes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(FLEET_NOTES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as { notes?: unknown };
    if (!parsed?.notes || typeof parsed.notes !== "object") return {};
    const notes: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed.notes)) {
      if (typeof value === "string") notes[key] = value;
    }
    return notes;
  } catch {
    return {};
  }
}

export function saveFleetNotes(notes: Record<string, string>): void {
  localStorage.setItem(FLEET_NOTES_KEY, JSON.stringify({ version: 1, notes }));
}

function normalizeCommand(raw: unknown): FleetCommand | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const id = typeof item.id === "string" ? item.id : "";
  const agentId = typeof item.agentId === "string" ? item.agentId : "";
  const agentName = typeof item.agentName === "string" ? item.agentName : "";
  const text = typeof item.text === "string" ? item.text.trim() : "";
  const createdAt = typeof item.createdAt === "string" ? item.createdAt : "";
  if (!id || !agentId || !text || !createdAt) return null;
  return {
    id,
    agentId,
    agentName: agentName || agentId,
    text,
    status: isStatus(item.status) ? item.status : "pending",
    createdAt,
  };
}

export function loadFleetQueue(): FleetCommand[] {
  try {
    const raw = localStorage.getItem(FLEET_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { commands?: unknown };
    if (!Array.isArray(parsed?.commands)) return [];
    return parsed.commands.map(normalizeCommand).filter((item): item is FleetCommand => Boolean(item));
  } catch {
    return [];
  }
}

export function saveFleetQueue(commands: FleetCommand[]): void {
  localStorage.setItem(FLEET_QUEUE_KEY, JSON.stringify({ version: 1, commands }));
}
