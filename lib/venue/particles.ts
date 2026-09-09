export type ParticleKind = "dust" | "firefly";

export type Particle = {
  id: number;
  kind: ParticleKind;
  x: number;
  y: number;
  originX: number;
  originY: number;
  phase: number;
  speed: number;
};

const MIN_X = 18;
const MAX_X = 342;
const MIN_Y = 14;
const MAX_Y = 154;

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

function wrap(value: number, min: number, max: number): number {
  const span = max - min;
  if (span <= 0) return min;
  let next = value;
  while (next < min) next += span;
  while (next > max) next -= span;
  return next;
}

export function spawnParticles(count: number, kind: ParticleKind, seed: number): Particle[] {
  const safeCount = Math.max(0, Math.floor(count));
  const rand = mulberry32(seed >>> 0);
  const particles: Particle[] = [];

  for (let i = 0; i < safeCount; i += 1) {
    const x = MIN_X + rand() * (MAX_X - MIN_X);
    const y = MIN_Y + rand() * (MAX_Y - MIN_Y);
    particles.push({
      id: i,
      kind,
      x,
      y,
      originX: x,
      originY: y,
      phase: rand() * Math.PI * 2,
      speed: kind === "firefly" ? 0.35 + rand() * 0.45 : 0.12 + rand() * 0.2,
    });
  }

  return particles;
}

export function stepParticle(particle: Particle, dt: number, time: number): Particle {
  const safeDt = Number.isFinite(dt) ? Math.max(0, dt) : 0;
  const t = Number.isFinite(time) ? time : 0;

  if (particle.kind === "dust") {
    return {
      ...particle,
      x: wrap(particle.x + Math.sin(t * particle.speed + particle.phase) * safeDt * 10, MIN_X, MAX_X),
      y: wrap(particle.y + Math.cos(t * particle.speed * 0.7 + particle.phase) * safeDt * 5, MIN_Y, MAX_Y),
    };
  }

  return {
    ...particle,
    x: wrap(particle.x + Math.sin(t + particle.phase) * safeDt * 14, MIN_X, MAX_X),
    y: wrap(particle.y + Math.cos(t * 0.8 + particle.phase * 0.7) * safeDt * 10, MIN_Y, MAX_Y),
  };
}

export function stepParticles(particles: readonly Particle[], dt: number, time: number): Particle[] {
  return particles.map((particle) => stepParticle(particle, dt, time));
}

export function projectParticle(particle: Particle, time: number): Particle {
  const t = Number.isFinite(time) ? time : 0;
  if (particle.kind === "dust") {
    return {
      ...particle,
      x: wrap(particle.originX + Math.sin(t * particle.speed + particle.phase) * 8, MIN_X, MAX_X),
      y: wrap(particle.originY + Math.cos(t * particle.speed * 0.7 + particle.phase) * 4, MIN_Y, MAX_Y),
    };
  }

  return {
    ...particle,
    x: wrap(particle.originX + Math.sin(t + particle.phase) * 10, MIN_X, MAX_X),
    y: wrap(particle.originY + Math.cos(t * 0.8 + particle.phase * 0.7) * 7, MIN_Y, MAX_Y),
  };
}

export function projectParticles(particles: readonly Particle[], time: number): Particle[] {
  return particles.map((particle) => projectParticle(particle, time));
}
