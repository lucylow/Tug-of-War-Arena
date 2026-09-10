export const WORLD_TITLE = 'Tug of War Arena: Friendzone'
export const WORLD_NAME_PLACEHOLDER = 'YOUR-NAME.dcl.eth'

export const ARENA_CENTER = { x: 16, y: 0, z: 16 } as const
export const SUN_BASE = { x: 5.2, y: 0, z: 16 } as const
export const MOON_BASE = { x: 26.8, y: 0, z: 16 } as const
export const EVENTS = { x: 16, y: 0, z: 28.6 } as const
export const ROPE_SEGMENTS = 19
export const PULL_MIN_INTERVAL_MS = 220
export const TARGET_UPDATE_MS = 100
export const MAX_TEMPORARY_ENTITIES = 24
export const MAX_PARTICLES = 20
export const MAX_STARS = 32

export const COLOR = {
  sun: { r: 0.957, g: 0.635, b: 0.38, a: 1 },
  moon: { r: 0.608, g: 0.549, b: 1, a: 1 },
  gold: { r: 1, g: 0.784, b: 0.341, a: 1 },
  cloud: { r: 0.961, g: 0.969, b: 1, a: 1 },
  midnight: { r: 0.114, g: 0.129, b: 0.314, a: 1 },
  floor: { r: 0.18, g: 0.2, b: 0.32, a: 1 },
} as const

export type GraphicsLevel = 'low' | 'medium' | 'high'

export const DEFAULT_GRAPHICS: GraphicsLevel = 'medium'

export function worldNameFromEnv(): string {
  return WORLD_NAME_PLACEHOLDER
}
