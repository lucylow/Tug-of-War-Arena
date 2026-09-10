import { WORLD_MAP_EXTENT } from "./constants";

function asMapCoord(value: number, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function scaleMapX(x: number): number {
  return Math.max(7, Math.min(93, (asMapCoord(x, WORLD_MAP_EXTENT / 2) / WORLD_MAP_EXTENT) * 100));
}

export function scaleMapY(z: number): number {
  return Math.max(8, Math.min(92, (asMapCoord(z, WORLD_MAP_EXTENT / 2) / WORLD_MAP_EXTENT) * 100));
}
