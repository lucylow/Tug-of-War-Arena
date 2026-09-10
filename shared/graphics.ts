import type { GraphicsLevel } from "./budgets";

export type { GraphicsLevel };

export interface GraphicsPreference {
  graphics: GraphicsLevel;
  reducedMotion: boolean;
}

export const DEFAULT_GRAPHICS: GraphicsPreference = {
  graphics: "medium",
  reducedMotion: false,
};

export function decorationEnabled(pref: GraphicsPreference): boolean {
  return pref.graphics !== "low" && !pref.reducedMotion;
}

export function ambientEffectsEnabled(pref: GraphicsPreference): boolean {
  return pref.graphics === "high" && !pref.reducedMotion;
}

export function avatarMotionScale(pref: GraphicsPreference): number {
  if (pref.reducedMotion) return 0.15;
  if (pref.graphics === "low") return 0.4;
  if (pref.graphics === "high") return 1;
  return 0.7;
}
