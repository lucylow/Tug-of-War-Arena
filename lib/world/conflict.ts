import type { WorldMatchResult } from "../../shared/match";

export interface MissionProgress {
  id: string;
  progress: number;
  origin: "demo" | "live";
}

export interface ActivityItem {
  id: string;
  timestamp: number;
  origin: "demo" | "live";
  text: string;
}

export interface PresenceBeat {
  playerId: string;
  heartbeat: number;
  origin: "demo" | "live";
}

export function mergeMissionProgress(a: MissionProgress, b: MissionProgress): MissionProgress {
  if (a.origin === "live" && b.origin === "demo") return a;
  if (b.origin === "live" && a.origin === "demo") return b;
  return a.progress >= b.progress ? a : b;
}

export function mergeActivity(items: ActivityItem[], incoming: ActivityItem[], max = 6): ActivityItem[] {
  const live = incoming.filter((item) => item.origin === "live");
  const demo = incoming.filter((item) => item.origin === "demo");
  const existingLive = items.filter((item) => item.origin === "live");
  const merged = [...existingLive, ...live, ...items.filter((item) => item.origin === "demo"), ...demo];
  const unique = new Map<string, ActivityItem>();
  for (const item of merged) {
    const current = unique.get(item.id);
    if (!current || item.timestamp >= current.timestamp) unique.set(item.id, item);
  }
  return [...unique.values()].sort((a, b) => b.timestamp - a.timestamp).slice(0, max);
}

export function mergePresence(current: PresenceBeat, incoming: PresenceBeat): PresenceBeat {
  if (incoming.origin === "demo" && current.origin === "live") return current;
  return incoming.heartbeat >= current.heartbeat ? incoming : current;
}

export function mergeMatchResults(existing: WorldMatchResult[], incoming: WorldMatchResult[]): WorldMatchResult[] {
  const map = new Map<string, WorldMatchResult>();
  for (const result of [...existing, ...incoming]) {
    const current = map.get(result.id);
    if (!current) {
      map.set(result.id, result);
      continue;
    }
    if (current.origin === "live" && result.origin === "demo") continue;
    map.set(result.id, result);
  }
  return [...map.values()];
}
