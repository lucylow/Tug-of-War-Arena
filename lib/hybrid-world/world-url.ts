import { DEFAULT_DECENTRALAND_WORLD_URL } from "./constants";

export function resolveDecentralandWorldUrl(explicit?: string | null): string {
  const fromEnv = typeof process !== "undefined" ? process.env.EXPO_PUBLIC_DECENTRALAND_WORLD_URL : undefined;
  const candidate = explicit?.trim() || fromEnv?.trim();
  return candidate && candidate.length > 0 ? candidate : DEFAULT_DECENTRALAND_WORLD_URL;
}
