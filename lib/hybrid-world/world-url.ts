import { DEFAULT_DECENTRALAND_WORLD_URL } from "./constants";

export function isDecentralandWorldUrl(url: string): boolean {
  if (typeof url !== "string" || !url.trim()) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function resolveDecentralandWorldUrl(explicit?: string | null): string {
  const fromEnv = typeof process !== "undefined" ? process.env.EXPO_PUBLIC_DECENTRALAND_WORLD_URL : undefined;
  const candidate = explicit?.trim() || fromEnv?.trim();
  if (candidate && isDecentralandWorldUrl(candidate)) return candidate;
  return DEFAULT_DECENTRALAND_WORLD_URL;
}
