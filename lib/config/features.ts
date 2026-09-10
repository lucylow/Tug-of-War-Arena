function readBooleanFlag(raw: string | undefined, fallback: boolean): boolean {
  if (raw == null || raw.trim() === "") return fallback;
  const normalized = raw.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

/**
 * Hackathon defaults: demo-first, wallet optional, no live chain writes.
 * Gameplay never requires these flags to be true.
 */
export const FEATURES = {
  DEMO_MODE: readBooleanFlag(process.env.EXPO_PUBLIC_DEMO_MODE, true),
  DEMO_WORLD_DATA: readBooleanFlag(process.env.EXPO_PUBLIC_DEMO_WORLD_DATA, true),
  LIVE_BLOCKCHAIN_WRITES: readBooleanFlag(process.env.EXPO_PUBLIC_LIVE_CHAIN_WRITES, false),
  REALTIME_MULTIPLAYER: readBooleanFlag(process.env.EXPO_PUBLIC_REALTIME_MULTIPLAYER, false),
  ENABLE_WALLET: readBooleanFlag(process.env.EXPO_PUBLIC_ENABLE_WALLET, true),
  ENABLE_GOVERNANCE: readBooleanFlag(process.env.EXPO_PUBLIC_ENABLE_GOVERNANCE, true),
  ENABLE_3D_WORLD: readBooleanFlag(process.env.EXPO_PUBLIC_ENABLE_3D_WORLD, true),
} as const;

export type FeatureName = keyof typeof FEATURES;

export function isFeatureEnabled(name: FeatureName): boolean {
  return FEATURES[name];
}
