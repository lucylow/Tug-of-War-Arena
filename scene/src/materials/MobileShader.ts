/**
 * MobileShader provides cheap PBR configs for phones: opaque, low metallic,
 * capped emissive, no specular fireworks.
 *
 * @see https://docs.decentraland.org/creator/build-for-mobile/develop/optimize-performance
 */

import { isMobileClient } from '../performance/platform'
import { BackfaceCulling } from './BackfaceCulling'
import {
  TRANSPARENCY_OPAQUE,
  parseColor,
  type ColorLike,
  type PbrMaterialConfig,
} from './types'

export class MobileShader {
  private static instance: MobileShader | null = null

  private isOnMobile: boolean

  private constructor() {
    this.isOnMobile = isMobileClient()
  }

  static getInstance(): MobileShader {
    if (!MobileShader.instance) {
      MobileShader.instance = new MobileShader()
    }
    return MobileShader.instance
  }

  static resetInstance(): void {
    MobileShader.instance = null
  }

  createOpaqueMaterial(color: string | ColorLike = '#FFFFFF', roughness: number = 0.8): PbrMaterialConfig {
    const albedo = parseColor(color)
    const material: PbrMaterialConfig = {
      albedoColor: albedo,
      roughness: this.isOnMobile ? Math.min(roughness, 0.8) : roughness,
      metallic: 0,
      transparencyMode: TRANSPARENCY_OPAQUE,
      castShadows: !this.isOnMobile,
    }
    return BackfaceCulling.getInstance().applyCulling(material)
  }

  createTexturedMaterial(texture: string, roughness: number = 0.8): PbrMaterialConfig {
    return {
      albedoTexture: texture,
      roughness: this.isOnMobile ? Math.min(roughness, 0.8) : roughness,
      metallic: 0,
      transparencyMode: TRANSPARENCY_OPAQUE,
      castShadows: !this.isOnMobile,
    }
  }

  createEmissiveMaterial(color: string | ColorLike, intensity: number = 0.5): PbrMaterialConfig {
    const albedo = parseColor(color)
    return {
      albedoColor: albedo,
      emissiveColor: albedo,
      emissiveIntensity: this.isOnMobile ? Math.min(intensity, 1) : intensity,
      roughness: 1,
      metallic: 0,
      transparencyMode: TRANSPARENCY_OPAQUE,
    }
  }

  /**
   * Fastest mobile look: skip lighting by driving albedo + a tiny emissive.
   */
  createUnlitMaterial(color: string | ColorLike): PbrMaterialConfig {
    const albedo = parseColor(color)
    return {
      albedoColor: albedo,
      roughness: 1,
      metallic: 0,
      emissiveColor: albedo,
      emissiveIntensity: 0.1,
      transparencyMode: TRANSPARENCY_OPAQUE,
      castShadows: false,
    }
  }

  optimizeMaterial(material: PbrMaterialConfig): PbrMaterialConfig {
    if (!this.isOnMobile) {
      return BackfaceCulling.getInstance().applyCulling(material)
    }

    if (material.roughness !== undefined) {
      material.roughness = Math.min(material.roughness, 0.8)
    }
    if (material.metallic !== undefined) {
      material.metallic = 0
    }
    if (material.emissiveIntensity !== undefined) {
      material.emissiveIntensity = Math.min(material.emissiveIntensity, 1)
    }
    material.castShadows = false
    return BackfaceCulling.getInstance().applyCulling(material)
  }
}
