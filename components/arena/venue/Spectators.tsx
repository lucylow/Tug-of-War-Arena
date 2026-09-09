import { Circle, G, Rect } from "react-native-svg";

import { createStandLayout } from "@/lib/venue";
import type { VenueFeatures } from "@/lib/venue";

type SpectatorsProps = {
  features: VenueFeatures;
};

const CROWD_COLORS = ["#FF6B6B", "#4DE7F2", "#FFC857", "#72F2B6", "#A8B0D8", "#F5F7FF", "#C6B089", "#8D7A58"];

export function Spectators({ features }: SpectatorsProps) {
  const stands = createStandLayout(features.standCount);

  return (
    <>
      {stands.map((stand, standIndex) => {
        const horizontal = stand.side === "back";
        const width = horizontal ? 168 : 10;
        const height = horizontal ? 12 : 54;
        const crowdCount = features.crowdPerStand;

        return (
          <G key={`stand-${stand.side}`}>
            <Rect
              x={stand.x - width / 2}
              y={stand.y - height / 2}
              width={width}
              height={height}
              rx={2}
              fill="#3A3228"
            />
            <Rect
              x={stand.x - width / 2 + 4}
              y={stand.y - height / 2 - (horizontal ? 4 : 0)}
              width={Math.max(6, width - 8)}
              height={horizontal ? 6 : height - 8}
              rx={1.5}
              fill="#4A4034"
            />
            {Array.from({ length: crowdCount }, (_, i) => {
              const offset = (i - (crowdCount - 1) / 2) * (horizontal ? 18 : 0);
              const cx = horizontal ? stand.x + offset : stand.x;
              const cy = horizontal ? stand.y - 2 : stand.y - 18 + i * 10;
              const color = CROWD_COLORS[(standIndex * 3 + i) % CROWD_COLORS.length] ?? "#A8B0D8";
              return (
                <G key={`crowd-${stand.side}-${i}`}>
                  <Rect x={cx - 2.4} y={cy} width={4.8} height={7} rx={1.4} fill={color} />
                  <Circle cx={cx} cy={cy - 1.6} r={2.1} fill="#E8C9A8" />
                </G>
              );
            })}
          </G>
        );
      })}
    </>
  );
}
