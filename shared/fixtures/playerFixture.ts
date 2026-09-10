import type { SimulatedPlayerProfile } from "../playerProfiles";
import { SIMULATED_PROFILES } from "../playerProfiles";

export const playerFixture = {
  local: {
    id: "local-player",
    displayName: "You",
    team: "sun" as const,
    origin: "demo" as const,
    spawn: { x: 4, y: 0.85, z: 8 },
  },
  featured: Object.values(SIMULATED_PROFILES) as SimulatedPlayerProfile[],
};
