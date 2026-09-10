export const WORLD_FEED_VERSION = 1;
export const WORLD_FEED_SUPPORTED_MIN_VERSION = 1;
export const WORLD_FEED_SUPPORTED_MAX_VERSION = 1;

export const WORLD_VERSION_INCOMPATIBLE = "This World version is not compatible with this app build.";

export function isSupportedFeedVersion(
  version: number,
  min = WORLD_FEED_SUPPORTED_MIN_VERSION,
  max = WORLD_FEED_SUPPORTED_MAX_VERSION,
): boolean {
  return Number.isInteger(version) && version >= min && version <= max;
}

export function migrateFeedVersion(version: unknown): number {
  const numeric = typeof version === "number" ? version : Number(version);
  if (!Number.isInteger(numeric) || numeric < 1) return WORLD_FEED_VERSION;
  if (numeric === WORLD_FEED_VERSION) return WORLD_FEED_VERSION;
  return numeric;
}
