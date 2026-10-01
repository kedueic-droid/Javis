import { useCallback, useEffect, useState } from "react";
import { findFleetAgent } from "../data/fleet";
import { createId } from "../lib/cn";
import { loadFleetNotes, loadFleetQueue, saveFleetNotes, saveFleetQueue } from "../lib/fleetStorage";
import type { FleetAgent, FleetCommand } from "../types";

const QUEUE_LIMIT = 40;
const COMMAND_LIMIT = 500;

export function useFleet() {
  const [notes, setNotes] = useState<Record<string, string>>(() => loadFleetNotes());
  const [queue, setQueue] = useState<FleetCommand[]>(() => loadFleetQueue());

  useEffect(() => {
    saveFleetNotes(notes);
  }, [notes]);

  useEffect(() => {
    saveFleetQueue(queue);
  }, [queue]);

  const missionOf = useCallback(
    (agent: FleetAgent) => (Object.prototype.hasOwnProperty.call(notes, agent.id) ? notes[agent.id] : agent.defaultMission),
    [notes],
  );

  const setMission = useCallback((agentId: string, text: string) => {
    setNotes((prev) => ({ ...prev, [agentId]: text }));
  }, []);

  const resetMission = useCallback((agentId: string) => {
    setNotes((prev) => {
      if (!Object.prototype.hasOwnProperty.call(prev, agentId)) return prev;
      const next = { ...prev };
      delete next[agentId];
      return next;
    });
  }, []);

  const enqueue = useCallback((agentId: string, text: string): { ok: true } | { ok: false; reason: string } => {
    const agent = findFleetAgent(agentId);
    const body = text.trim();
    if (!agent) return { ok: false, reason: "請先選擇代理人" };
    if (!body) return { ok: false, reason: "請寫入指令內容" };
    if (body.length > COMMAND_LIMIT) return { ok: false, reason: `指令請少於 ${COMMAND_LIMIT} 字` };

    const command: FleetCommand = {
      id: createId("fleet"),
      agentId: agent.id,
      agentName: agent.name,
      text: body,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    setQueue((prev) => [command, ...prev].slice(0, QUEUE_LIMIT));
    return { ok: true };
  }, []);

  const removeCommand = useCallback((id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return {
    missionOf,
    setMission,
    resetMission,
    queue,
    enqueue,
    removeCommand,
  };
}
