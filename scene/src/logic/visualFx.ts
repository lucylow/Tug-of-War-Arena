/**
 * SDK-free math for the Part 2 visual suite (glow, UV scroll, fire, LOD,
 * vegetation scatter, banners, power surge / combo). Covered by Vitest.
 */

import { ARENA_CENTER, clamp, lerp, normalizeTeam, type CrewId, type TeamAlias, type Vec3 } from './mapping'

export type Vec2 = { x: number; y: number }

export type QualityBand = 'ultra' | 'high' | 'medium' | 'low' | 'minimal'

export type VegetationKind = 'grass' | 'rock' | 'tree'

export type VegetationPlacement = {
  kind: VegetationKind
  position: Vec3
  scale: Vec3
  yaw: number
}

export type FireParticleState = {
  origin: Vec3
  position: Vec3
  velocity: Vec3
  life: number
  maxLife: number
  size: number
}

export type PowerSurgeState = {
  team: CrewId
  scale: number
  alpha: number
  elapsed: number
  maxScale: number
}

export const SURGE_MAX_SCALE = 5
export const SURGE_EXPAND_SPEED = 2.4
export const COMBO_POWER_THRESHOLD = 60
export const TORCH_KEEP_OUT = 10

export function wrap01(value: number): number {
  return value - Math.floor(value)
}

export function glowPulseIntensity(
  time: number,
  min: number = 0.5,
  max: number = 2,
  speed: number = 2,
): number {
  const pulse = 0.5 + 0.5 * Math.sin(time * speed)
  return min + pulse * (max - min)
}

export function torchFlicker(time: number, seed: number = 0): number {
  return 0.85 + 0.18 * Math.sin(time * 5 + seed) + 0.07 * Math.sin(time * 13.7 + seed * 2.1)
}

export function scrollUvOffset(
  offset: Vec2,
  dt: number,
  speed: { x?: number; y?: number } = {},
): Vec2 {
  return {
    x: wrap01(offset.x + dt * (speed.x ?? 0.1)),
    y: wrap01(offset.y + dt * (speed.y ?? 0.05)),
  }
}

/**
 * SDK 7 materials do not expose UV offset. Drive a shimmer with emissive
 * so energy strips still read as moving.
 */
export function emissiveScrollProxy(time: number, base: number = 0.55, amplitude: number = 0.45): number {
  return base + amplitude * (0.5 + 0.5 * Math.sin(time * 1.8) * Math.cos(time * 0.7))
}

export function bannerSwayDegrees(time: number, speed: number = 0.9, amplitude: number = 9): number {
  return Math.sin(time * speed) * amplitude
}

export function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state += 0x6d2b79f5
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function vegetationBudget(level: QualityBand): { grass: number; rocks: number; trees: number } {
  switch (level) {
    case 'ultra':
      return { grass: 18, rocks: 10, trees: 6 }
    case 'high':
      return { grass: 14, rocks: 8, trees: 5 }
    case 'medium':
      return { grass: 8, rocks: 5, trees: 3 }
    case 'low':
      return { grass: 4, rocks: 2, trees: 1 }
    default:
      return { grass: 0, rocks: 0, trees: 0 }
  }
}

export function scatterVegetation(options: {
  grass: number
  rocks: number
  trees: number
  spread?: number
  keepout?: number
  seed?: number
  center?: Vec3
}): VegetationPlacement[] {
  const spread = options.spread ?? 20
  const keepout = options.keepout ?? TORCH_KEEP_OUT
  const center = options.center ?? ARENA_CENTER
  const rand = mulberry32(options.seed ?? 20260909)
  const placements: VegetationPlacement[] = []

  const place = (kind: VegetationKind, count: number, scaleRange: [number, number]) => {
    let attempts = 0
    let placed = 0
    while (placed < count && attempts < count * 12) {
      attempts += 1
      const x = center.x + (rand() - 0.5) * spread
      const z = center.z + (rand() - 0.5) * spread
      if (Math.abs(x - center.x) < keepout && Math.abs(z - center.z) < keepout) continue
      const s = lerp(scaleRange[0], scaleRange[1], rand())
      placements.push({
        kind,
        position: { x, y: 0, z },
        scale: { x: s, y: s * (kind === 'grass' ? 0.85 + rand() * 0.3 : 1), z: s },
        yaw: rand() * 360,
      })
      placed += 1
    }
  }

  place('grass', options.grass, [0.45, 0.9])
  place('rock', options.rocks, [0.35, 0.7])
  place('tree', options.trees, [0.8, 1.25])
  return placements
}

export function createFireParticle(origin: Vec3, rand: () => number = Math.random): FireParticleState {
  const maxLife = 0.7 + rand() * 0.8
  return {
    origin: { ...origin },
    position: {
      x: origin.x + (rand() - 0.5) * 0.35,
      y: origin.y + rand() * 0.25,
      z: origin.z + (rand() - 0.5) * 0.35,
    },
    velocity: {
      x: (rand() - 0.5) * 0.45,
      y: 0.55 + rand() * 0.55,
      z: (rand() - 0.5) * 0.45,
    },
    life: rand() * maxLife,
    maxLife,
    size: 0.08 + rand() * 0.12,
  }
}

export function stepFireParticle(
  particle: FireParticleState,
  dt: number,
  rand: () => number = Math.random,
): FireParticleState {
  const life = particle.life + dt
  if (life >= particle.maxLife) {
    return createFireParticle(particle.origin, rand)
  }
  const t = life / particle.maxLife
  return {
    ...particle,
    life,
    position: {
      x: particle.position.x + particle.velocity.x * dt,
      y: particle.position.y + particle.velocity.y * dt,
      z: particle.position.z + particle.velocity.z * dt,
    },
    size: particle.size * (1 - t * 0.65),
  }
}

export function fireParticleAlpha(particle: FireParticleState): number {
  return clamp(1 - particle.life / particle.maxLife, 0, 1)
}

export function createPowerSurgeState(team: TeamAlias, maxScale: number = SURGE_MAX_SCALE): PowerSurgeState {
  return {
    team: normalizeTeam(team),
    scale: 0.12,
    alpha: 1,
    elapsed: 0,
    maxScale,
  }
}

export function stepPowerSurge(state: PowerSurgeState, dt: number, speed: number = SURGE_EXPAND_SPEED): PowerSurgeState {
  const scale = state.scale + dt * speed
  const alpha = clamp(1 - scale / state.maxScale, 0, 1)
  return { ...state, scale, alpha, elapsed: state.elapsed + dt }
}

export function powerSurgeDone(state: PowerSurgeState): boolean {
  return state.scale >= state.maxScale
}

export function isComboActive(sunPower: number, moonPower: number, threshold: number = COMBO_POWER_THRESHOLD): boolean {
  return sunPower >= threshold && moonPower >= threshold
}

export function lodTier(distance: number, near: number = 10, far: number = 18): 'high' | 'medium' | 'low' {
  if (distance < near) return 'high'
  if (distance < far) return 'medium'
  return 'low'
}

export function godRayCount(level: QualityBand): number {
  if (level === 'ultra') return 3
  if (level === 'high') return 2
  if (level === 'medium') return 1
  return 0
}

export function skyboxEnabled(level: QualityBand, mobile: boolean): boolean {
  if (mobile) return false
  return level === 'ultra' || level === 'high'
}

export function advancedPropBudget(level: QualityBand): { torches: number; banners: boolean; dummy: boolean; trails: boolean } {
  return {
    torches: level === 'minimal' ? 0 : level === 'low' ? 2 : 4,
    banners: level !== 'minimal',
    dummy: true,
    trails: level === 'ultra' || level === 'high' || level === 'medium',
  }
}

export function ambientVolume(intensity: number = 1): number {
  return clamp(0.22 * intensity, 0, 0.45)
}

export function sfxVolume(kind: 'pull' | 'surge' | 'combo'): number {
  if (kind === 'combo') return 0.7
  if (kind === 'surge') return 0.55
  return 0.4
}

export const TORCH_OFFSETS: Vec3[] = [
  { x: -8, y: 0, z: -8 },
  { x: 8, y: 0, z: -8 },
  { x: -8, y: 0, z: 8 },
  { x: 8, y: 0, z: 8 },
]
