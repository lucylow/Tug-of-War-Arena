import type { VenueFeatures, VenueTeam, Vec2 } from "./types";
import { ARENA_VIEWBOX } from "./types";

export type ColumnMarker = Vec2 & { rotation: number; scale: number };
export type BannerMarker = Vec2 & { team: VenueTeam };
export type FlagMarker = Vec2 & { team: VenueTeam };
export type StandMarker = Vec2 & { side: "back" | "left" | "right" };
export type WallMarker = { x: number; y: number; width: number; height: number };
export type FloorTile = { x: number; y: number; width: number; height: number; shade: 0 | 1 };

export const TORCH_POSITIONS: readonly Vec2[] = [
  { x: 36, y: 42 },
  { x: 324, y: 42 },
  { x: 36, y: 138 },
  { x: 324, y: 138 },
];

export const STATUE_POSITIONS: readonly Vec2[] = [
  { x: 62, y: 148 },
  { x: 298, y: 148 },
  { x: 78, y: 34 },
  { x: 282, y: 34 },
];

export const FLAG_POSITIONS: readonly FlagMarker[] = [
  { x: 16, y: 26, team: "red" },
  { x: 344, y: 26, team: "blue" },
];

export function createColumnLayout(count: number): ColumnMarker[] {
  const safeCount = Math.max(0, Math.floor(count));
  const columns: ColumnMarker[] = [];
  const radiusX = 148;
  const radiusY = 54;

  for (let i = 0; i < safeCount; i += 1) {
    const angle = (i / safeCount) * Math.PI * 2 - Math.PI / 2;
    const y = 88 + Math.sin(angle) * radiusY;
    columns.push({
      x: 180 + Math.cos(angle) * radiusX,
      y,
      rotation: (-angle * 180) / Math.PI,
      scale: 0.72 + (y / ARENA_VIEWBOX.height) * 0.38,
    });
  }

  return columns;
}

export function createBannerLayout(): BannerMarker[] {
  return [
    { x: 24, y: 64, team: "red" },
    { x: 336, y: 64, team: "blue" },
    { x: 108, y: 20, team: "red" },
    { x: 252, y: 20, team: "blue" },
  ];
}

export function createStandLayout(count: number): StandMarker[] {
  const stands: StandMarker[] = [{ x: 180, y: 16, side: "back" }];
  if (count >= 3) {
    stands.push({ x: 14, y: 92, side: "left" }, { x: 346, y: 92, side: "right" });
  }
  return stands.slice(0, Math.max(0, Math.floor(count)));
}

export function createBoundaryWalls(): WallMarker[] {
  return [
    { x: 4, y: 2, width: 352, height: 5 },
    { x: 4, y: 161, width: 352, height: 5 },
    { x: 2, y: 4, width: 5, height: 160 },
    { x: 353, y: 4, width: 5, height: 160 },
  ];
}

export function createFloorTiles(enabled: boolean): FloorTile[] {
  if (!enabled) return [];

  const cols = 10;
  const rows = 5;
  const width = ARENA_VIEWBOX.width / cols;
  const height = ARENA_VIEWBOX.height / rows;
  const tiles: FloorTile[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      tiles.push({
        x: col * width,
        y: row * height,
        width,
        height,
        shade: ((row + col) % 2 === 0 ? 0 : 1),
      });
    }
  }

  return tiles;
}

export function createDecorationPlan(features: VenueFeatures) {
  return {
    columns: createColumnLayout(features.columnCount),
    torches: [...TORCH_POSITIONS],
    banners: createBannerLayout(),
    statues: features.showStatues ? [...STATUE_POSITIONS] : [],
    stands: createStandLayout(features.standCount),
    flags: [...FLAG_POSITIONS],
    walls: createBoundaryWalls(),
    tiles: createFloorTiles(features.showCheckerboard),
  };
}
