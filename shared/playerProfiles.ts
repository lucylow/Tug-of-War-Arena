export type SimulatedPlayerId = "NovaWisp" | "PixelRally" | "MoonRunner" | "SunSpark" | "RopeWizard";

export type SimulatedProfileKind = "aggressive" | "social" | "steady" | "mission" | "veteran";

export interface SimulatedPlayerProfile {
  id: SimulatedPlayerId;
  team: "sun" | "moon";
  kind: SimulatedProfileKind;
  pullWeight: number;
  reactionWeight: number;
  missionWeight: number;
  synthetic: true;
}

export const SIMULATED_PROFILES: Record<SimulatedPlayerId, SimulatedPlayerProfile> = {
  NovaWisp: { id: "NovaWisp", team: "sun", kind: "aggressive", pullWeight: 0.9, reactionWeight: 0.3, missionWeight: 0.4, synthetic: true },
  PixelRally: { id: "PixelRally", team: "moon", kind: "social", pullWeight: 0.35, reactionWeight: 0.95, missionWeight: 0.35, synthetic: true },
  MoonRunner: { id: "MoonRunner", team: "moon", kind: "steady", pullWeight: 0.6, reactionWeight: 0.25, missionWeight: 0.4, synthetic: true },
  SunSpark: { id: "SunSpark", team: "sun", kind: "mission", pullWeight: 0.45, reactionWeight: 0.4, missionWeight: 0.95, synthetic: true },
  RopeWizard: { id: "RopeWizard", team: "sun", kind: "veteran", pullWeight: 0.7, reactionWeight: 0.35, missionWeight: 0.55, synthetic: true },
};
