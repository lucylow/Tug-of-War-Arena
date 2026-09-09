import { Circle, Ellipse, Path, Rect } from "react-native-svg";

import { createBoundaryWalls, createFloorTiles } from "@/lib/venue";
import type { VenueFeatures } from "@/lib/venue";

type ArenaGroundProps = {
  gid: string;
  features: VenueFeatures;
};

export function ArenaGround({ gid, features }: ArenaGroundProps) {
  const tiles = createFloorTiles(features.showCheckerboard);
  const walls = createBoundaryWalls();
  const wallAlpha = features.lod === "low" ? 0.18 : 0.34;

  return (
    <>
      <Rect width="360" height="168" fill={`url(#arenaFloor${gid})`} />
      {tiles.map((tile, index) => (
        <Rect
          key={`tile-${index}`}
          x={tile.x}
          y={tile.y}
          width={tile.width}
          height={tile.height}
          fill={tile.shade === 0 ? "#1A1F4A" : "#141834"}
          opacity={0.55}
        />
      ))}
      <Ellipse cx="180" cy="138" rx="132" ry="18" fill="#4DE7F2" opacity="0.08" />
      <Path d="M18 48h324" stroke="#3A407A" strokeDasharray="7 8" strokeWidth="1.4" />
      <Path d="M180 18v128" stroke="#F5F7FF" strokeOpacity="0.22" strokeWidth="2" />
      {walls.map((wall, index) => (
        <Rect
          key={`wall-${index}`}
          x={wall.x}
          y={wall.y}
          width={wall.width}
          height={wall.height}
          rx="1.5"
          fill="#8B93C4"
          opacity={wallAlpha}
        />
      ))}
      <Circle cx="8" cy="8" r="3" fill="#C4B08A" />
      <Circle cx="352" cy="8" r="3" fill="#C4B08A" />
      <Circle cx="8" cy="160" r="3" fill="#C4B08A" />
      <Circle cx="352" cy="160" r="3" fill="#C4B08A" />
    </>
  );
}
