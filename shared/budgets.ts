export const MAX_VISIBLE_ACTIVITY = 6;
export const MAX_VISIBLE_EVENTS = 5;
export const MAX_MOBILE_PLAYERS = 12;
export const MAX_REACTION_EFFECTS = 6;
export const MAX_CACHED_MATCHES = 30;
export const MAX_PARTICLE_EFFECTS = 20;
export const MAX_VISIBLE_LABELS = 18;
export const MAX_FEATURED_AVATARS = 6;
export const MAX_LEADERBOARD_ROWS = 8;
export const MAX_STAR_POINTS = 36;
export const PULL_MIN_INTERVAL_MS = 220;
export const REACTION_TTL_MS = 2_400;

export const WORLD_ENTITY_BUDGET = {
  static: 180,
  dynamic: 90,
  temporary: 24,
} as const;

export type GraphicsLevel = "low" | "medium" | "high";

export const DEFAULT_GRAPHICS_LEVEL: GraphicsLevel = "medium";

export function particleBudgetForGraphics(level: GraphicsLevel, reducedMotion: boolean): number {
  if (reducedMotion) return 0;
  if (level === "low") return Math.min(6, MAX_PARTICLE_EFFECTS);
  if (level === "high") return MAX_PARTICLE_EFFECTS;
  return Math.min(12, MAX_PARTICLE_EFFECTS);
}

export function animationHzForDistance(distance: number, featured: boolean): number {
  if (featured || distance < 8) return 12;
  if (distance < 16) return 4;
  return 1;
}
