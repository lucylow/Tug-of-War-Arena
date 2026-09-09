/**
 * SDK-free visual mapping for the Decentraland arena.
 * Keep this file free of `@dcl/sdk` imports so the Expo test suite can cover it.
 */

export const PULL_MIN = -44
export const PULL_MAX = 44
export const WIN_THRESHOLD = 44
export const MATCH_DURATION_SECONDS = 30
export const ROPE_HALF_SPAN = 9
export const ARENA_CENTER = { x: 16, y: 0, z: 16 } as const
export const MAX_SCENE_PARTICLES = 200
export const MAX_AVATARS_PER_TEAM = 4

export type CrewId = 'sun' | 'moon'
export type TeamAlias = CrewId | 'red' | 'blue'
export type WeatherKind = 'clear' | 'sparkle' | 'rain' | 'snow' | 'fog'
export type AvatarClip = 'idle' | 'tap' | 'swipe' | 'celebrate' | 'defeat'

export type Vec3 = { x: number; y: number; z: number }

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function normalizeTeam(team: TeamAlias): CrewId {
  if (team === 'red' || team === 'sun') return 'sun'
  return 'moon'
}

export function clampPull(pull: number): number {
  return clamp(pull, PULL_MIN, PULL_MAX)
}

/** Map the mobile rope pull (-44..44) onto world X around the arena center. */
export function mapPullToWorldX(pull: number, centerX: number = ARENA_CENTER.x): number {
  const t = clampPull(pull) / PULL_MAX
  return centerX + t * ROPE_HALF_SPAN
}

/** Whole-rope tilt in degrees; sun (negative pull) leans west. */
export function mapPullToTiltDegrees(pull: number): number {
  return (clampPull(pull) / PULL_MAX) * 15
}

export function mapPullToStretch(pull: number): number {
  return 1 + Math.abs(clampPull(pull)) * 0.005
}

export function hasVisualWin(pull: number): boolean {
  return Math.abs(clampPull(pull)) >= WIN_THRESHOLD
}

export function winningCrew(pull: number): CrewId | null {
  const value = clampPull(pull)
  if (value >= WIN_THRESHOLD) return 'sun'
  if (value <= -WIN_THRESHOLD) return 'moon'
  return null
}

export function getSpawnPosition(team: TeamAlias, index: number): Vec3 {
  const crew = normalizeTeam(team)
  const slot = clamp(Math.floor(index), 0, MAX_AVATARS_PER_TEAM - 1)
  const baseX = crew === 'sun' ? ARENA_CENTER.x - 4.2 : ARENA_CENTER.x + 4.2
  const zOffset = (slot - 1.5) * 1.55
  return { x: baseX, y: 0.55, z: ARENA_CENTER.z + zOffset }
}

export function getWinZonePosition(team: TeamAlias): Vec3 {
  const crew = normalizeTeam(team)
  const x = crew === 'sun' ? ARENA_CENTER.x - ROPE_HALF_SPAN : ARENA_CENTER.x + ROPE_HALF_SPAN
  return { x, y: 0.12, z: ARENA_CENTER.z }
}

export function getFlagPosition(team: TeamAlias): Vec3 {
  const crew = normalizeTeam(team)
  const x = crew === 'sun' ? ARENA_CENTER.x - 11.4 : ARENA_CENTER.x + 11.4
  return { x, y: 0, z: ARENA_CENTER.z }
}

/**
 * Build a sagging spline for the rope. `time` adds a light traveling wave so the
 * line never looks frozen while both crews hold.
 */
export function ropeControlPoints(
  pull: number,
  segmentCount: number,
  time: number = 0,
): Vec3[] {
  const count = Math.max(2, Math.floor(segmentCount))
  const shift = mapPullToWorldX(pull) - ARENA_CENTER.x
  const points: Vec3[] = []
  for (let i = 0; i <= count; i += 1) {
    const t = i / count
    const along = (t - 0.5) * (ROPE_HALF_SPAN * 2)
    const follow = shift * (1 - Math.abs(t - 0.5) * 0.35)
    const sag = Math.sin(t * Math.PI) * 0.42
    const wave = Math.sin(t * Math.PI * 3 + time * 2.4) * 0.08
    points.push({
      x: ARENA_CENTER.x + along + follow,
      y: 1.55 - sag,
      z: ARENA_CENTER.z + wave + shift * 0.015,
    })
  }
  return points
}

export function segmentTransform(
  from: Vec3,
  to: Vec3,
): { position: Vec3; yaw: number; pitch: number; length: number } {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const dz = to.z - from.z
  const length = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.01
  const yaw = Math.atan2(dx, dz)
  const pitch = Math.asin(clamp(dy / length, -1, 1))
  return {
    position: {
      x: (from.x + to.x) / 2,
      y: (from.y + to.y) / 2,
      z: (from.z + to.z) / 2,
    },
    yaw,
    pitch,
    length,
  }
}

export function powerBarWidth(power: number, maxWidth: number): number {
  const ratio = clamp(power / 100, 0, 1)
  return Math.max(4, ratio * maxWidth)
}

export function formatTimer(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds))
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatScore(sun: number, moon: number): string {
  return `${Math.max(0, Math.floor(sun))} – ${Math.max(0, Math.floor(moon))}`
}

export function weatherParticleBudget(kind: WeatherKind, intensity: number): number {
  const scale = clamp(intensity, 0, 1)
  const base =
    kind === 'clear' ? 0 : kind === 'sparkle' ? 24 : kind === 'fog' ? 40 : kind === 'snow' ? 70 : 90
  return Math.min(MAX_SCENE_PARTICLES, Math.round(base * scale))
}

export function remainingParticleBudget(used: number): number {
  return Math.max(0, MAX_SCENE_PARTICLES - Math.max(0, used))
}

export function pulseScale(time: number, amplitude: number = 0.08): number {
  return 1 + Math.sin(time * 2.2) * amplitude
}

export function avatarIdleOffset(time: number, index: number): number {
  return Math.sin(time * 2.6 + index * 0.9) * 0.045
}
