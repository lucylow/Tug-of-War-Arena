import { ARENA_COLORS } from "./theme";

export const CONFETTI_DURATION_MS = 2000;
export const DEFAULT_CONFETTI_COUNT = 48;

export const CONFETTI_COLORS = [
  ARENA_COLORS.teamRed,
  ARENA_COLORS.primary,
  ARENA_COLORS.teamBlue,
  ARENA_COLORS.mint,
  "#FF6BD6",
] as const;

export interface ConfettiPiece {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  spin: number;
  scale: number;
}

export function createConfettiPieces(
  count: number,
  width: number,
  height: number,
  colors: readonly string[] = CONFETTI_COLORS,
  seed = 1,
): ConfettiPiece[] {
  const safeCount = Number.isFinite(count) ? Math.max(0, Math.min(80, Math.floor(count))) : 0;
  const w = Number.isFinite(width) && width > 0 ? width : 360;
  const h = Number.isFinite(height) && height > 0 ? height : 640;
  const palette = colors.length > 0 ? colors : CONFETTI_COLORS;
  const pieces: ConfettiPiece[] = [];
  let state = seed >>> 0;

  const rand = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  for (let i = 0; i < safeCount; i += 1) {
    const color = palette[Math.floor(rand() * palette.length)] ?? ARENA_COLORS.primary;
    pieces.push({
      id: `c_${i}`,
      x: w / 2 + (rand() - 0.5) * 100,
      y: h * 0.28,
      vx: (rand() - 0.5) * 280,
      vy: -180 - rand() * 220,
      size: 4 + rand() * 8,
      color,
      rotation: rand() * 360,
      spin: (rand() - 0.5) * 540,
      scale: 0.55 + rand() * 0.55,
    });
  }

  return pieces;
}

export function confettiPose(piece: ConfettiPiece, t: number): {
  x: number;
  y: number;
  rotate: number;
  opacity: number;
  scale: number;
} {
  const progress = Number.isFinite(t) ? Math.max(0, Math.min(1, t)) : 0;
  const gravity = 520;
  return {
    x: piece.x + piece.vx * progress,
    y: piece.y + piece.vy * progress + gravity * progress * progress,
    rotate: piece.rotation + piece.spin * progress,
    opacity: 1 - progress,
    scale: piece.scale * (1 - progress * 0.25),
  };
}
