/**
 * Shared material types. Kept free of `@dcl/sdk` so Vitest can cover the suite.
 */

export type Vec3Like = { x: number; y: number; z: number }

export type ColorLike = { r: number; g: number; b: number; a?: number }

export type EntityId = number

export type MeshKey = 'box' | 'sphere' | 'cylinder' | 'plane' | 'mesh' | 'gltf'

/** SDK7 `MaterialTransparencyMode.MT_OPAQUE` */
export const TRANSPARENCY_OPAQUE = 0
export const TRANSPARENCY_ALPHA_TEST = 1
export const TRANSPARENCY_ALPHA_BLEND = 2

export interface PbrMaterialConfig {
  albedoColor?: ColorLike
  albedoTexture?: string
  roughness?: number
  metallic?: number
  emissiveColor?: ColorLike
  emissiveIntensity?: number
  transparencyMode?: number
  alphaTest?: number
  castShadows?: boolean
}

export interface PooledMaterial {
  key: string
  reused: boolean
  config: PbrMaterialConfig
}

export interface MaterialBudget {
  maxMaterials: number
  maxTextures: number
  maxTextureResolution: number
  maxDrawCalls: number
}

export type BudgetWarning = (metric: string, usage: number, limit: number) => void

export interface AtlasUVs {
  uMin: number
  vMin: number
  uMax: number
  vMax: number
}

export interface AtlasSlot {
  name: string
  x: number
  y: number
  width: number
  height: number
  uvs: AtlasUVs
}

export interface LODLevel {
  distance: number
  mesh: string
  scale: number
}

export interface LODChange {
  entity: EntityId
  previousLevel: number
  level: number
  mesh: string
  scale: number
}

export interface CullChange {
  entity: EntityId
  visible: boolean
  reason: 'distance' | 'frustum' | 'restored'
}

export interface CameraPose {
  position: Vec3Like
  direction: Vec3Like
}

export function colorKey(color: ColorLike, roughness = 0.5, metallic = 0, extra = ''): string {
  const alpha = color.a ?? 1
  return `color_${color.r.toFixed(3)}_${color.g.toFixed(3)}_${color.b.toFixed(3)}_${alpha.toFixed(3)}_${roughness.toFixed(2)}_${metallic.toFixed(2)}_${extra}`
}

export function colorDistance(a: ColorLike, b: ColorLike): number {
  const dr = a.r - b.r
  const dg = a.g - b.g
  const db = a.b - b.b
  const da = (a.a ?? 1) - (b.a ?? 1)
  return Math.sqrt(dr * dr + dg * dg + db * db + da * da)
}

export function parseColor(input: string | ColorLike): ColorLike {
  if (typeof input !== 'string') {
    return { r: input.r, g: input.g, b: input.b, a: input.a ?? 1 }
  }
  const raw = input.replace('#', '')
  const hex =
    raw.length === 3
      ? raw
          .split('')
          .map((channel) => channel + channel)
          .join('')
      : raw
  const value = Number.parseInt(hex, 16)
  if (!Number.isFinite(value)) {
    return { r: 1, g: 1, b: 1, a: 1 }
  }
  return {
    r: ((value >> 16) & 255) / 255,
    g: ((value >> 8) & 255) / 255,
    b: (value & 255) / 255,
    a: 1,
  }
}

export function vecDistance(a: Vec3Like, b: Vec3Like): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const dz = a.z - b.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

export function vecSubtract(a: Vec3Like, b: Vec3Like): Vec3Like {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
}

export function vecLength(a: Vec3Like): number {
  return Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z)
}

export function vecNormalize(a: Vec3Like): Vec3Like {
  const length = vecLength(a)
  if (length <= 1e-8) return { x: 0, y: 0, z: 0 }
  return { x: a.x / length, y: a.y / length, z: a.z / length }
}

export function vecDot(a: Vec3Like, b: Vec3Like): number {
  return a.x * b.x + a.y * b.y + a.z * b.z
}
