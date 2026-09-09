import { ARENA_CENTER } from './logic/mapping'
import type { WeatherKind } from './logic/mapping'

/**
 * Toggle after dropping Blender GLBs into `models/`.
 * Primitive meshes keep the scene previewable without those assets.
 */
export const USE_GLB_ASSETS = false

export const ENABLE_NETWORK_SYNC = false
export const ENABLE_DEMO_SINE_ROPE = true
export const ENABLE_CLICK_TO_PULL = true
export const ENABLE_ADVANCED_VISUALS = true
export const ENABLE_SCENE_AUDIO = true

export const MODELS = {
  arena: 'models/arena.glb',
  rope: 'models/rope.glb',
  flagSun: 'models/flag_sun.glb',
  flagMoon: 'models/flag_moon.glb',
  avatarSun: 'models/avatar_sun.glb',
  avatarMoon: 'models/avatar_moon.glb',
  winZoneSun: 'models/win_zone_sun.glb',
  winZoneMoon: 'models/win_zone_moon.glb',
  torch: 'models/torch.glb',
  bannerSun: 'models/banner_sun.glb',
  bannerMoon: 'models/banner_moon.glb',
  dummy: 'models/dummy.glb',
  grass: 'models/grass_clump.glb',
  rock: 'models/rock_small.glb',
  tree: 'models/tree.glb',
} as const

export const SOUNDS = {
  ambientCrowd: 'sounds/ambient_crowd.mp3',
  pull: 'sounds/pull.mp3',
  surge: 'sounds/power_surge.mp3',
  combo: 'sounds/combo.mp3',
  torch: 'sounds/torch_crackle.mp3',
} as const

export const SCENE = {
  center: ARENA_CENTER,
  parcelSize: 32,
  defaultWeather: 'sparkle' as WeatherKind,
  nightSeconds: 72000,
  ropeSegments: 14,
}

export const PERFORMANCE = {
  maxParticles: 200,
  maxLights: 4,
  avatarIdle: true,
  targetFpsMobile: 30,
  targetFpsDesktop: 60,
  enableMonitor: true,
}
