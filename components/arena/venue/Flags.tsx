import { G, Path, Rect } from "react-native-svg";

import { FLAG_POSITIONS } from "@/lib/venue";
import type { VenueFeatures } from "@/lib/venue";

type FlagsProps = {
  features: VenueFeatures;
  teamColor: string;
  opponentColor: string;
  time: number;
};

export function Flags({ features, teamColor, opponentColor, time }: FlagsProps) {
  return (
    <>
      {FLAG_POSITIONS.map((flag, index) => {
        const color = flag.team === "red" ? teamColor : opponentColor;
        const wave = features.animateFlags ? Math.sin(time * 1.6 + index) * 4 : 0;
        return (
          <G key={`flag-${flag.team}`}>
            <Rect x={flag.x - 1.2} y={flag.y - 18} width={2.4} height={36} fill="#C6B089" />
            <Path
              d={`M${flag.x + 1.2} ${flag.y - 16} Q ${flag.x + 18 + wave} ${flag.y - 10}, ${flag.x + 16} ${flag.y + 2} L ${flag.x + 1.2} ${flag.y} Z`}
              fill={color}
            />
          </G>
        );
      })}
    </>
  );
}
