import { Circle } from "react-native-svg";

import type { Particle } from "@/lib/venue";

type ParticlesProps = {
  dust: readonly Particle[];
  fireflies: readonly Particle[];
};

export function Particles({ dust, fireflies }: ParticlesProps) {
  return (
    <>
      {dust.map((particle) => (
        <Circle
          key={`dust-${particle.id}`}
          cx={particle.x}
          cy={particle.y}
          r={1.1}
          fill="#D7DCF5"
          opacity={0.28}
        />
      ))}
      {fireflies.map((particle) => (
        <Circle
          key={`firefly-${particle.id}`}
          cx={particle.x}
          cy={particle.y}
          r={1.7}
          fill="#FFE38A"
          opacity={0.9}
        />
      ))}
    </>
  );
}
