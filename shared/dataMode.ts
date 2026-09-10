/**
 * DataMode describes how Friendzone data is sourced.
 *
 * - demo: all synthetic, deterministic, labeled origin="demo"
 * - live: backend / wallet / World feed only
 * - hybrid: real local player + seeded ambient presentation data
 *
 * Default hackathon configuration is hybrid so the World feels alive
 * without claiming real platform-wide activity.
 */
export type DataMode = "demo" | "live" | "hybrid";

export const DEFAULT_DATA_MODE: DataMode = "hybrid";

export function resolveDataMode(raw: string | null | undefined): DataMode {
  if (raw === "live" || raw === "demo" || raw === "hybrid") return raw;
  return DEFAULT_DATA_MODE;
}

export function isSyntheticAmbientEnabled(mode: DataMode): boolean {
  return mode === "demo" || mode === "hybrid";
}

export function livePlayerEnabled(mode: DataMode): boolean {
  return mode === "live" || mode === "hybrid";
}

export function originForMode(mode: DataMode): "demo" | "live" {
  return mode === "live" ? "live" : "demo";
}
