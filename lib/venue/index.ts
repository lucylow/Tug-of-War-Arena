export { ARENA_VIEWBOX } from "./types";
export type { VenueFeatures, VenueLod, VenueProfile, VenueTeam, Vec2 } from "./types";

export {
  VenueOptimizer,
  estimateVenueBudget,
  pickVenueModel,
  resolveVenueFeatures,
  resolveVenueLod,
} from "./optimization";
export type { VenueBudget } from "./optimization";

export {
  FLAG_POSITIONS,
  STATUE_POSITIONS,
  TORCH_POSITIONS,
  createBannerLayout,
  createBoundaryWalls,
  createColumnLayout,
  createDecorationPlan,
  createFloorTiles,
  createStandLayout,
} from "./layout";
export type {
  BannerMarker,
  ColumnMarker,
  FlagMarker,
  FloorTile,
  StandMarker,
  WallMarker,
} from "./layout";

export { projectParticle, projectParticles, spawnParticles, stepParticle, stepParticles } from "./particles";
export type { Particle, ParticleKind } from "./particles";

export { createVenueLights, torchFlicker } from "./lighting";
export type { VenueLight, VenueLightType } from "./lighting";

export {
  formatPracticeDummyPresentation,
  formatVenueScoreboard,
  hitPracticeDummy,
} from "./interactive";
