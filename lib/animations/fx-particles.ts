import { ARENA_COLORS } from "./theme";

export const FX_PARTICLE_COLORS = [
  ARENA_COLORS.teamRed,
  ARENA_COLORS.primary,
  ARENA_COLORS.teamBlue,
  ARENA_COLORS.mint,
  "#FF6BD6",
] as const;

export const DEFAULT_FX_COUNT = 48;
export const DEFAULT_SPARKLE_COUNT = 24;
export const FX_GRAVITY = 0.04;

export type FxParticle = {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  life: number;
  maxLife: number;
};

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function particleOpacity(life: number, maxLife: number): number {
  const max = Number.isFinite(maxLife) && maxLife > 0 ? maxLife : 1;
  const t = Number.isFinite(life) ? Math.max(0, Math.min(1, life / max)) : 1;
  return 1 - t;
}

export function particleRadius(particle: Pick<FxParticle, "r" | "life" | "maxLife">): number {
  return particle.r * particleOpacity(particle.life, particle.maxLife);
}

export function createFxParticles(
  count: number,
  width: number,
  height: number,
  colors: readonly string[] = FX_PARTICLE_COLORS,
  seed = 1,
): FxParticle[] {
  const safeCount = Number.isFinite(count) ? Math.max(0, Math.min(80, Math.floor(count))) : 0;
  const w = Number.isFinite(width) && width > 0 ? width : 360;
  const h = Number.isFinite(height) && height > 0 ? height : 640;
  const palette = colors.length > 0 ? colors : FX_PARTICLE_COLORS;
  const rand = mulberry32(seed);
  const particles: FxParticle[] = [];

  for (let i = 0; i < safeCount; i += 1) {
    const color = palette[Math.floor(rand() * palette.length)] ?? ARENA_COLORS.primary;
    particles.push({
      id: `fx_${i}`,
      x: rand() * w,
      y: rand() * h,
      vx: (rand() - 0.5) * 4,
      vy: (rand() - 0.5) * 4 - 1,
      r: 2 + rand() * 6,
      color,
      life: 0,
      maxLife: 80 + rand() * 80,
    });
  }

  return particles;
}

export function createSparkles(
  count: number,
  originX: number,
  originY: number,
  color: string = ARENA_COLORS.primary,
  seed = 1,
): FxParticle[] {
  const safeCount = Number.isFinite(count) ? Math.max(0, Math.min(40, Math.floor(count))) : 0;
  const x = Number.isFinite(originX) ? originX : 0;
  const y = Number.isFinite(originY) ? originY : 0;
  const rand = mulberry32(seed);
  const sparkles: FxParticle[] = [];

  for (let i = 0; i < safeCount; i += 1) {
    sparkles.push({
      id: `sp_${i}`,
      x: x + (rand() - 0.5) * 10,
      y: y + (rand() - 0.5) * 10,
      vx: (rand() - 0.5) * 2,
      vy: (rand() - 0.5) * 2 - 1,
      r: 2 + rand() * 4,
      color: rand() > 0.5 ? color : "#FFFFFF",
      life: 0,
      maxLife: 20 + rand() * 30,
    });
  }

  return sparkles;
}

export function stepFxParticle(
  particle: FxParticle,
  jitter = 0.2,
  rand: () => number = Math.random,
): FxParticle | null {
  const nextLife = particle.life + 1;
  if (nextLife > particle.maxLife) return null;
  const j = Number.isFinite(jitter) ? jitter : 0;
  const sample = typeof rand === "function" ? rand() : 0.5;
  return {
    ...particle,
    x: particle.x + particle.vx,
    y: particle.y + particle.vy,
    vx: particle.vx + (sample - 0.5) * j,
    vy: particle.vy + (sample - 0.5) * j + FX_GRAVITY,
    life: nextLife,
  };
}

export function fxParticlePose(
  particle: FxParticle,
  t: number,
): { x: number; y: number; opacity: number; r: number } {
  "worklet";
  const progress = Number.isFinite(t) ? Math.max(0, Math.min(1, t)) : 0;
  const frames = particle.maxLife * progress;
  return {
    x: particle.x + particle.vx * frames,
    y: particle.y + particle.vy * frames + FX_GRAVITY * frames * frames * 0.5,
    opacity: 1 - progress,
    r: particle.r * (1 - progress * 0.45),
  };
}
