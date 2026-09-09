import { WORLD_MAP_EXTENT } from "./constants";

export function scaleMapX(x: number): number {
  return Math.max(7, Math.min(93, (x / WORLD_MAP_EXTENT) * 100));
}

export function scaleMapY(z: number): number {
  return Math.max(8, Math.min(92, (z / WORLD_MAP_EXTENT) * 100));
}
