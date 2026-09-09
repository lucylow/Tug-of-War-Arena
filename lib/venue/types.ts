export type VenueLod = "low" | "medium" | "high";

export type VenueTeam = "red" | "blue";

export type Vec2 = {
  x: number;
  y: number;
};

export type VenueProfile = {
  compact?: boolean;
  reduceMotion?: boolean;
  /** Native phone clients use a tighter visual budget than desktop web. */
  mobile?: boolean;
};

export type VenueFeatures = {
  lod: VenueLod;
  columnCount: number;
  crowdPerStand: number;
  standCount: number;
  dustCount: number;
  fireflyCount: number;
  showCheckerboard: boolean;
  showTorchGlow: boolean;
  showFireflies: boolean;
  showStatues: boolean;
  showShadows: boolean;
  animateParticles: boolean;
  animateFlags: boolean;
  particleFps: number;
};

export const ARENA_VIEWBOX = {
  width: 360,
  height: 168,
} as const;
