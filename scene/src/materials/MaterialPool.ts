/**
 * MaterialPool reuses PBR definitions across entities so the explorer can
 * batch identical shaders. SDK7 attaches Material as a component per entity;
 * pooling the *definition* is what keeps unique GPU materials down.
 */

import { isMobileClient } from '../performance/platform'
import { BackfaceCulling } from './BackfaceCulling'
import { MobileShader } from './MobileShader'
import {
  colorDistance,
  colorKey,
  type ColorLike,
  type PooledMaterial,
  type PbrMaterialConfig,
} from './types'

export class MaterialPool {
  private static instance: MaterialPool | null = null

  private pool: Map<string, PbrMaterialConfig> = new Map()
  private maxMaterials: number

  private constructor() {
    this.maxMaterials = isMobileClient() ? 200 : 500
  }

  static getInstance(): MaterialPool {
    if (!MaterialPool.instance) {
      MaterialPool.instance = new MaterialPool()
    }
    return MaterialPool.instance
  }

  static resetInstance(): void {
    MaterialPool.instance = null
  }

  getMaterial(key: string, createFn: () => PbrMaterialConfig): PooledMaterial {
    const cached = this.pool.get(key)
    if (cached) {
      return { key, reused: true, config: cached }
    }

    if (this.pool.size >= this.maxMaterials) {
      console.warn(`[MaterialPool] Material budget exceeded (${this.maxMaterials}). Reusing nearest.`)
      const nearest = this.nearestKey()
      const fallback = nearest ? this.pool.get(nearest) : undefined
      if (fallback && nearest) {
        return { key: nearest, reused: true, config: fallback }
      }
    }

    const created = createFn()
    MobileShader.getInstance().optimizeMaterial(created)
    BackfaceCulling.getInstance().applyCulling(created)
    this.pool.set(key, created)
    return { key, reused: false, config: created }
  }

  getColoredMaterial(
    color: ColorLike,
    roughness: number = 0.5,
    metallic: number = 0,
    extras: Pick<PbrMaterialConfig, 'emissiveColor' | 'emissiveIntensity' | 'albedoTexture'> = {},
  ): PooledMaterial {
    const extra = [
      extras.albedoTexture ?? '',
      extras.emissiveColor ? colorKey(extras.emissiveColor, 0, 0) : '',
      extras.emissiveIntensity?.toFixed(2) ?? '',
    ].join('_')
    const key = colorKey(color, roughness, metallic, extra)

    if (this.pool.size >= this.maxMaterials && !this.pool.has(key)) {
      const nearest = this.nearestColor(color)
      if (nearest) return nearest
    }

    return this.getMaterial(key, () => ({
      albedoColor: { r: color.r, g: color.g, b: color.b, a: color.a ?? 1 },
      albedoTexture: extras.albedoTexture,
      roughness,
      metallic,
      emissiveColor: extras.emissiveColor,
      emissiveIntensity: extras.emissiveIntensity ?? 0,
      transparencyMode: 0,
    }))
  }

  getTexturedMaterial(texture: string, roughness: number = 0.5, metallic: number = 0): PooledMaterial {
    const key = `texture_${texture}_${roughness.toFixed(2)}_${metallic.toFixed(2)}`
    return this.getMaterial(key, () => ({
      albedoTexture: texture,
      roughness,
      metallic,
      transparencyMode: 0,
    }))
  }

  clear(): void {
    this.pool.clear()
  }

  getSize(): number {
    return this.pool.size
  }

  getMaxMaterials(): number {
    return this.maxMaterials
  }

  has(key: string): boolean {
    return this.pool.has(key)
  }

  private nearestKey(): string | undefined {
    return this.pool.keys().next().value
  }

  private nearestColor(color: ColorLike): PooledMaterial | null {
    let bestKey: string | null = null
    let bestConfig: PbrMaterialConfig | null = null
    let best = Number.POSITIVE_INFINITY

    for (const [key, config] of this.pool) {
      if (!config.albedoColor) continue
      const distance = colorDistance(color, config.albedoColor)
      if (distance < best) {
        best = distance
        bestKey = key
        bestConfig = config
      }
    }

    if (!bestKey || !bestConfig) {
      const first = this.nearestKey()
      const config = first ? this.pool.get(first) : undefined
      if (!first || !config) return null
      return { key: first, reused: true, config }
    }

    return { key: bestKey, reused: true, config: bestConfig }
  }
}
