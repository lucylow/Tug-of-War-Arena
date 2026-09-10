import type { HybridSimulationState, HybridWorldDataset } from "./types";

const IDLE_STATE: HybridSimulationState = {
  roomId: "room_friday",
  phase: "waiting",
  ropePosition: 0,
  sunScore: 0,
  moonScore: 0,
  elapsedSeconds: 0,
  highlightedPlayerId: "player_0",
};

function asFiniteNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function tickHybridSimulation(
  state: HybridSimulationState | null | undefined,
  _dataset: HybridWorldDataset | null | undefined,
  deltaSeconds: number,
): HybridSimulationState {
  if (!state || typeof state !== "object") return IDLE_STATE;
  if (state.phase !== "active") return state;

  const dt = Math.max(0, asFiniteNumber(deltaSeconds));
  if (dt === 0) return state;

  const elapsed = Math.max(0, asFiniteNumber(state.elapsedSeconds));
  const rope = asFiniteNumber(state.ropePosition);
  const direction = Math.sin(elapsed * 0.9) >= 0 ? 1 : -1;
  const drift = direction * Math.min(0.018, dt * 0.014);

  return {
    ...state,
    ropePosition: Math.max(-1, Math.min(1, rope + drift)),
    sunScore: Math.max(0, asFiniteNumber(state.sunScore)) + (drift > 0 ? 1 : 0),
    moonScore: Math.max(0, asFiniteNumber(state.moonScore)) + (drift < 0 ? 1 : 0),
    elapsedSeconds: elapsed + dt,
  };
}
