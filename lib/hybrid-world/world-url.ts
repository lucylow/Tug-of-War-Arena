import { DEFAULT_DECENTRALAND_WORLD_URL } from "./constants";

export function isDecentralandWorldUrl(url: string): boolean {
  if (typeof url !== "string" || !url.trim()) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "javascript:" || parsed.protocol === "data:" || parsed.protocol === "file:") {
      return false;
    }
    if (parsed.protocol === "https:") return Boolean(parsed.hostname);
    if (parsed.protocol === "http:") {
      return parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    }
    return parsed.protocol === "decentraland:" || parsed.protocol === "friendzone:";
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
