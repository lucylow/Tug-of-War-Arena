import { SyncManager } from "@/lib/multiplayer/SyncManager";
import type { MatchState } from "@/lib/multiplayer/types";

export type CompanionRemotePacket = {
  pull: number;
  sunPower: number;
  moonPower: number;
  timeRemaining: number;
  score: [number, number];
  phase: "idle" | "countdown" | "live" | "results";
};

export function matchStateToRemotePacket(state: MatchState): CompanionRemotePacket {
  const phase =
    state.matchStatus === "playing"
      ? "live"
      : state.matchStatus === "ended"
        ? "results"
        : state.matchStatus === "waiting"
          ? "idle"
          : "countdown";

  return {
    pull: state.ropePosition,
    sunPower: state.teamPower[0],
    moonPower: state.teamPower[1],
    timeRemaining: state.matchTime,
    score: [state.scores[0], state.scores[1]],
    phase,
  };
}

export function reportLocalPull(kind: "tap" | "swipe", data: { amount: number; taps?: number } = { amount: 2.3 }): void {
  const sync = SyncManager.getInstance();
  if (sync.isConnected()) sync.sendAction(kind, data);
}
