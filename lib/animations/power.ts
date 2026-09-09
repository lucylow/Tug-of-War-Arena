export const POWER_GLOW_THRESHOLD = 0.7;

export function powerProgress(power: number, maxPower: number): number {
  if (!Number.isFinite(power) || !Number.isFinite(maxPower) || maxPower <= 0) return 0;
  return Math.max(0, Math.min(1, power / maxPower));
}

export function shouldGlow(
  power: number,
  maxPower: number,
  glow = false,
  threshold = POWER_GLOW_THRESHOLD,
): boolean {
  return glow && powerProgress(power, maxPower) > threshold;
}

export function withAlpha(color: string, hexAlpha: string): string {
  if (color.startsWith("#") && (color.length === 7 || color.length === 4)) {
    return `${color}${hexAlpha}`;
  }
  return color;
}
