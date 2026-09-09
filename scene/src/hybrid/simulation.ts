import type { HybridSimulationState, HybridWorldDataset } from "./types";

export function tickHybridSimulation(
  state: HybridSimulationState,
  _dataset: HybridWorldDataset,
  deltaSeconds: number,
): HybridSimulationState {
  if (state.phase !== "active") return state;

  const dt = Math.max(0, deltaSeconds);
  const direction = Math.sin(state.elapsedSeconds * 0.9) >= 0 ? 1 : -1;
  const drift = direction * Math.min(0.018, dt * 0.014);

  return {
    ...state,
    ropePosition: Math.max(-1, Math.min(1, state.ropePosition + drift)),
    sunScore: state.sunScore + (drift > 0 ? 1 : 0),
    moonScore: state.moonScore + (drift < 0 ? 1 : 0),
    elapsedSeconds: state.elapsedSeconds + dt,
  };
}
