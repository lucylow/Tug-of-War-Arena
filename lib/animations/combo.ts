export const COMBO_VISIBLE_AT = 3;
export const SURGE_STREAK = 7;

export function isComboVisible(combo: number): boolean {
  return Number.isFinite(combo) && combo >= COMBO_VISIBLE_AT;
}

export function comboMultiplier(combo: number): number {
  if (!Number.isFinite(combo) || combo < COMBO_VISIBLE_AT) return 1;
  return Math.round((1 + (combo - 2) * 0.1) * 10) / 10;
}

export function isSurgeReady(combo: number): boolean {
  return Number.isFinite(combo) && combo >= SURGE_STREAK;
}
