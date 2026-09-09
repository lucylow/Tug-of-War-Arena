import { Circle, Ellipse, RadialGradient, Stop } from "react-native-svg";

import { createVenueLights, torchFlicker } from "@/lib/venue";
import type { VenueFeatures } from "@/lib/venue";

type LightingProps = {
  gid: string;
  features: VenueFeatures;
  time: number;
};

export function Lighting({ gid, features, time }: LightingProps) {
  const lights = createVenueLights(features);

  return (
    <>
      {lights.map((light) => {
        const flicker = light.type === "torch" ? torchFlicker(time, Number(light.id.split("-")[1] ?? 0)) : 1;
        const opacity = Math.max(0.04, light.intensity * 0.18 * flicker);
        return (
          <Ellipse
            key={light.id}
            cx={light.x}
            cy={light.y}
            rx={light.radius}
            ry={light.type === "directional" ? light.radius * 0.42 : light.radius * 0.72}
            fill={`url(#${light.id}${gid})`}
            opacity={opacity}
          />
        );
      })}
      {features.showShadows ? <Ellipse cx="180" cy="150" rx="118" ry="10" fill="#0B0E24" opacity="0.28" /> : null}
    </>
  );
}

export function LightingDefs({ gid, features }: { gid: string; features: VenueFeatures }) {
  const lights = createVenueLights(features);

  return (
    <>
      {lights.map((light) => (
        <RadialGradient
          key={`def-${light.id}`}
          id={`${light.id}${gid}`}
          cx={String(light.x)}
          cy={String(light.y)}
          rx={String(light.radius)}
          ry={String(light.radius)}
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={light.color} stopOpacity="0.85" />
          <Stop offset="1" stopColor={light.color} stopOpacity="0" />
        </RadialGradient>
      ))}
    </>
  );
}

export function TorchGlow({ gid, features, time }: LightingProps) {
  if (!features.showTorchGlow) return null;
  const lights = createVenueLights(features).filter((light) => light.type === "torch");

  return (
    <>
      {lights.map((light, index) => (
        <Circle
          key={`glow-${light.id}`}
          cx={light.x}
          cy={light.y}
          r={9}
          fill={`url(#${light.id}${gid})`}
          opacity={0.45 + torchFlicker(time, index) * 0.25}
        />
      ))}
    </>
  );
}
