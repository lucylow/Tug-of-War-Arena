import { Circle, G, Path, Rect } from "react-native-svg";

import { createDecorationPlan } from "@/lib/venue";
import type { VenueFeatures } from "@/lib/venue";

type DecorationsProps = {
  features: VenueFeatures;
  teamColor: string;
  opponentColor: string;
  time: number;
};

function columnCapital(y: number, scale: number) {
  const w = 11 * scale;
  const h = 28 * scale;
  return { w, h, cap: 5 * scale, base: 4 * scale, top: y - h };
}

export function Decorations({ features, teamColor, opponentColor, time }: DecorationsProps) {
  const plan = createDecorationPlan(features);

  return (
    <>
      {plan.columns.map((column, index) => {
        const { w, h, cap, base, top } = columnCapital(column.y, column.scale);
        return (
          <G key={`col-${index}`}>
            <Rect x={column.x - w / 2} y={top} width={w} height={h} rx={1.2} fill="#8D7A58" />
            <Rect x={column.x - w / 2 - 2} y={top - cap + 1} width={w + 4} height={cap} rx={1} fill="#C6B089" />
            <Rect x={column.x - w / 2 - 2} y={top + h} width={w + 4} height={base} rx={1} fill="#6E5F43" />
          </G>
        );
      })}
      {plan.statues.map((statue, index) => (
        <G key={`statue-${index}`}>
          <Rect x={statue.x - 5} y={statue.y - 4} width={10} height={4} rx={1} fill="#6A624F" />
          <Rect x={statue.x - 3} y={statue.y - 18} width={6} height={14} rx={2} fill="#B7A888" />
          <Circle cx={statue.x} cy={statue.y - 21} r={3.2} fill="#D8C9A6" />
        </G>
      ))}
      {plan.banners.map((banner, index) => {
        const color = banner.team === "red" ? teamColor : opponentColor;
        const sway = features.animateFlags ? Math.sin(time * (1.1 + index * 0.13) + index) * 3.5 : 0;
        return (
          <G key={`banner-${index}`}>
            <Rect x={banner.x - 1} y={banner.y - 16} width={2} height={28} fill="#C6B089" />
            <Path
              d={`M${banner.x + 1} ${banner.y - 14} Q ${banner.x + 16 + sway} ${banner.y - 8}, ${banner.x + 14} ${banner.y + 8} L ${banner.x + 1} ${banner.y + 6} Z`}
              fill={color}
              opacity={0.92}
            />
          </G>
        );
      })}
      {plan.torches.map((torch, index) => {
        const flicker = features.animateFlags ? Math.sin(time * 7 + index) * 1.4 : 0;
        return (
          <G key={`torch-${index}`}>
            <Rect x={torch.x - 1.4} y={torch.y - 10} width={2.8} height={16} fill="#6E5F43" />
            <Path
              d={`M${torch.x - 4} ${torch.y - 10} Q ${torch.x} ${torch.y - 22 - flicker}, ${torch.x + 4} ${torch.y - 10} Z`}
              fill="#FFC857"
            />
            <Path
              d={`M${torch.x - 2.2} ${torch.y - 10} Q ${torch.x} ${torch.y - 17 - flicker}, ${torch.x + 2.2} ${torch.y - 10} Z`}
              fill="#FF6B6B"
            />
          </G>
        );
      })}
    </>
  );
}
