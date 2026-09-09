/**
 * BackfaceCulling keeps materials opaque so the explorer skips hidden
 * triangles and expensive alpha blending (the usual overdraw source).
 *
 * @see https://docs.decentraland.org/creator/build-for-mobile/develop/optimize-performance#reduce-overdraw
 */

import { isMobileClient } from '../performance/platform'
import { TRANSPARENCY_OPAQUE, type PbrMaterialConfig } from './types'

export class BackfaceCulling {
  private static instance: BackfaceCulling | null = null

  static getInstance(): BackfaceCulling {
    if (!BackfaceCulling.instance) {
      BackfaceCulling.instance = new BackfaceCulling()
    }
    return BackfaceCulling.instance
  }

  static resetInstance(): void {
    BackfaceCulling.instance = null
  }

  /**
   * Prefer opaque shading. SDK7 enables hardware backface culling on opaque
   * PBR; blended materials pay overdraw on both faces.
   */
  applyCulling(material: PbrMaterialConfig): PbrMaterialConfig {
    if (isMobileClient()) {
      material.transparencyMode = TRANSPARENCY_OPAQUE
      if (material.albedoColor && (material.albedoColor.a ?? 1) < 1) {
        material.albedoColor = { ...material.albedoColor, a: 1 }
      }
    } else if (material.transparencyMode === undefined) {
      material.transparencyMode = TRANSPARENCY_OPAQUE
    }
    return material
  }

  isCullingEnabled(material: PbrMaterialConfig): boolean {
    return (material.transparencyMode ?? TRANSPARENCY_OPAQUE) === TRANSPARENCY_OPAQUE
  }

  optimizeForMobile(material: PbrMaterialConfig): PbrMaterialConfig {
    if (material.roughness !== undefined) {
      material.roughness = Math.min(material.roughness, 0.8)
    }
    if (material.metallic !== undefined) {
      material.metallic = Math.min(material.metallic, 0.2)
    }
    this.applyCulling(material)
    return material
  }
}
