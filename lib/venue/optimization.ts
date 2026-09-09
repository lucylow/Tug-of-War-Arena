import type { VenueFeatures, VenueLod, VenueProfile } from "./types";

/**
 * Mobile-first LOD for the 2D plaza venue.
 * Compact home previews and reduced-motion clients drop to the cheapest layer set.
 */
export function resolveVenueLod(profile: VenueProfile): VenueLod {
  if (profile.compact) return "low";
  if (profile.mobile && profile.reduceMotion) return "low";
  if (profile.mobile) return "medium";
  if (profile.reduceMotion) return "medium";
  return "high";
}

export function resolveVenueFeatures(profile: VenueProfile): VenueFeatures {
  const lod = resolveVenueLod(profile);
  const animate = !profile.reduceMotion && !profile.compact;

  if (lod === "low") {
    return {
      lod,
      columnCount: 6,
      crowdPerStand: 2,
      standCount: 1,
      dustCount: 8,
      fireflyCount: 0,
      showCheckerboard: false,
      showTorchGlow: false,
      showFireflies: false,
      showStatues: false,
      showShadows: false,
      animateParticles: false,
      animateFlags: false,
      particleFps: 8,
    };
  }

  if (lod === "medium") {
    return {
      lod,
      columnCount: 8,
      crowdPerStand: 4,
      standCount: 3,
      dustCount: 16,
      fireflyCount: 0,
      showCheckerboard: true,
      showTorchGlow: true,
      showFireflies: false,
      showStatues: true,
      showShadows: false,
      animateParticles: animate,
      animateFlags: animate,
      particleFps: 10,
    };
  }

  return {
    lod,
    columnCount: 12,
    crowdPerStand: 6,
    standCount: 3,
    dustCount: 24,
    fireflyCount: 12,
    showCheckerboard: true,
    showTorchGlow: true,
    showFireflies: true,
    showStatues: true,
    showShadows: true,
    animateParticles: animate,
    animateFlags: animate,
    particleFps: 12,
  };
}

export type VenueBudget = {
  entities: number;
  drawCalls: number;
  triangles: number;
  withinMobileBudget: boolean;
};

/**
 * Conservative entity budget used to keep the plaza inside Decentraland mobile limits
 * even though this client renders SVG rather than GLBs.
 */
export function estimateVenueBudget(features: VenueFeatures): VenueBudget {
  const ground = 1;
  const walls = 4;
  const columns = features.columnCount;
  const torches = 4;
  const banners = 4;
  const statues = features.showStatues ? 4 : 0;
  const stands = features.standCount;
  const crowd = stands * features.crowdPerStand;
  const flags = 2;
  const dummy = 1;
  const scoreboard = 1;
  const particles = features.dustCount + features.fireflyCount;
  const entities =
    ground + walls + columns + torches + banners + statues + stands + crowd + flags + dummy + scoreboard + particles;

  return {
    entities,
    drawCalls: entities,
    triangles: entities * 24,
    withinMobileBudget: entities < 4800 && entities * 24 < 1_000_000,
  };
}

export function pickVenueModel(profile: VenueProfile, highDetail: string, lowDetail: string): string {
  return resolveVenueLod(profile) === "high" ? highDetail : lowDetail;
}

export class VenueOptimizer {
  private readonly profile: VenueProfile;

  constructor(profile: VenueProfile) {
    this.profile = profile;
  }

  getFeatures(): VenueFeatures {
    return resolveVenueFeatures(this.profile);
  }

  getModel(highDetail: string, lowDetail: string): string {
    return pickVenueModel(this.profile, highDetail, lowDetail);
  }

  getBudget(): VenueBudget {
    return estimateVenueBudget(this.getFeatures());
  }
}
