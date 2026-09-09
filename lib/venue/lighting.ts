import { TORCH_POSITIONS } from "./layout";
import type { VenueFeatures } from "./types";

export type VenueLightType = "directional" | "ambient" | "spot" | "torch";

export type VenueLight = {
  id: string;
  type: VenueLightType;
  color: string;
  intensity: number;
  x: number;
  y: number;
  radius: number;
  shadow: boolean;
};

export function createVenueLights(features: VenueFeatures): VenueLight[] {
  const lights: VenueLight[] = [
    {
      id: "sun",
      type: "directional",
      color: "#FFF1D2",
      intensity: 1.5,
      x: 228,
      y: 10,
      radius: 210,
      shadow: features.showShadows,
    },
    {
      id: "ambient",
      type: "ambient",
      color: "#4C5A86",
      intensity: 0.55,
      x: 180,
      y: 84,
      radius: 190,
      shadow: false,
    },
    {
      id: "spot",
      type: "spot",
      color: "#FFD6A0",
      intensity: 1.15,
      x: 180,
      y: 78,
      radius: 64,
      shadow: false,
    },
  ];

  if (!features.showTorchGlow) {
    return lights;
  }

  TORCH_POSITIONS.forEach((pos, index) => {
    lights.push({
      id: `torch-${index}`,
      type: "torch",
      color: "#FF7A1A",
      intensity: 0.8,
      x: pos.x,
      y: pos.y - 12,
      radius: 22,
      shadow: false,
    });
  });

  return lights;
}

export function torchFlicker(time: number, index: number): number {
  if (!Number.isFinite(time)) return 0.7;
  return 0.58 + Math.sin(time * 6 + index * 1.7) * 0.18;
}
