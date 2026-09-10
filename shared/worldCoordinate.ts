export interface WorldCoordinate {
  x: number;
  y: number;
  z: number;
}

export const WORLD_MAP_EXTENT = 32;

export function createWorldCoordinate(x = 0, y = 0, z = 0): WorldCoordinate {
  return {
    x: Number.isFinite(x) ? x : 0,
    y: Number.isFinite(y) ? y : 0,
    z: Number.isFinite(z) ? z : 0,
  };
}

export function normalizeWorldPosition(point: WorldCoordinate, extent = WORLD_MAP_EXTENT): WorldCoordinate {
  const size = Number.isFinite(extent) && extent > 0 ? extent : WORLD_MAP_EXTENT;
  return {
    x: Math.max(0, Math.min(size, Number.isFinite(point.x) ? point.x : 0)),
    y: Number.isFinite(point.y) ? point.y : 0,
    z: Math.max(0, Math.min(size, Number.isFinite(point.z) ? point.z : 0)),
  };
}

export function distanceBetweenWorldPoints(a: WorldCoordinate, b: WorldCoordinate): number {
  const dx = (Number.isFinite(a.x) ? a.x : 0) - (Number.isFinite(b.x) ? b.x : 0);
  const dy = (Number.isFinite(a.y) ? a.y : 0) - (Number.isFinite(b.y) ? b.y : 0);
  const dz = (Number.isFinite(a.z) ? a.z : 0) - (Number.isFinite(b.z) ? b.z : 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function isWithinRadius(point: WorldCoordinate, center: WorldCoordinate, radius: number): boolean {
  const r = Number.isFinite(radius) && radius >= 0 ? radius : 0;
  return distanceBetweenWorldPoints(point, center) <= r;
}

export interface MiniMapPoint {
  x: number;
  y: number;
}

export function worldToMiniMap(point: WorldCoordinate, extent = WORLD_MAP_EXTENT): MiniMapPoint {
  const normalized = normalizeWorldPosition(point, extent);
  const size = Number.isFinite(extent) && extent > 0 ? extent : WORLD_MAP_EXTENT;
  return {
    x: Math.max(0, Math.min(1, normalized.x / size)),
    y: Math.max(0, Math.min(1, normalized.z / size)),
  };
}

export function miniMapToWorld(point: MiniMapPoint, y = 0, extent = WORLD_MAP_EXTENT): WorldCoordinate {
  const size = Number.isFinite(extent) && extent > 0 ? extent : WORLD_MAP_EXTENT;
  const x = Number.isFinite(point.x) ? point.x : 0;
  const mapY = Number.isFinite(point.y) ? point.y : 0;
  return normalizeWorldPosition(
    {
      x: x * size,
      y,
      z: mapY * size,
    },
    size,
  );
}
