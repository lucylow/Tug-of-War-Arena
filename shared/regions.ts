import {
  distanceBetweenWorldPoints,
  type WorldCoordinate,
  isWithinRadius,
} from "./worldCoordinate";

export type WorldRegionId =
  | "spawn"
  | "sunBase"
  | "moonBase"
  | "arena"
  | "social"
  | "events"
  | "governance"
  | "achievements";

export interface WorldRegion {
  id: WorldRegionId;
  center: WorldCoordinate;
  radius: number;
  label: string;
}

export const REGIONS: Record<WorldRegionId, WorldRegion> = {
  spawn: { id: "spawn", center: { x: 16, y: 0, z: 4 }, radius: 5, label: "SPAWN" },
  sunBase: { id: "sunBase", center: { x: 5, y: 0, z: 16 }, radius: 4.5, label: "SUN CREW BASE" },
  moonBase: { id: "moonBase", center: { x: 27, y: 0, z: 16 }, radius: 4.5, label: "MOON CREW BASE" },
  arena: { id: "arena", center: { x: 16, y: 0, z: 16 }, radius: 6, label: "ARENA" },
  social: { id: "social", center: { x: 16, y: 0, z: 24 }, radius: 4.2, label: "SOCIAL PLAZA" },
  events: { id: "events", center: { x: 8, y: 0, z: 26 }, radius: 4, label: "EVENT PLAZA" },
  governance: { id: "governance", center: { x: 24, y: 0, z: 26 }, radius: 4, label: "GOVERNANCE PLAZA" },
  achievements: { id: "achievements", center: { x: 16, y: 0, z: 29 }, radius: 3.6, label: "ACHIEVEMENT HALL" },
};

export const REGION_NOTICE_COOLDOWN_MS = 8_000;

export function regionAt(point: WorldCoordinate): WorldRegion | null {
  let closest: WorldRegion | null = null;
  let best = Number.POSITIVE_INFINITY;
  for (const region of Object.values(REGIONS)) {
    if (!isWithinRadius(point, region.center, region.radius)) continue;
    const distance = distanceBetweenWorldPoints(point, region.center);
    if (distance < best) {
      best = distance;
      closest = region;
    }
  }
  return closest;
}

export function regionLabel(id: WorldRegionId): string {
  return REGIONS[id]?.label ?? id.toUpperCase();
}
