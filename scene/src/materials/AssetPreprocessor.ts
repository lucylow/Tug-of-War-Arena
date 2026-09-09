/**
 * AssetPreprocessor is the platform lookup table for texture format,
 * resolution, mesh quality, LOD distances, and atlas size.
 *
 * @see https://docs.decentraland.org/creator/build-for-mobile/develop/optimize-performance
 */

import { isMobileClient } from '../performance/platform'

export type MeshQuality = 'high' | 'medium' | 'low'
export type TextureFormat = 'webp' | 'png' | 'ktx2'

export interface LODDistances {
  near: number
  medium: number
  far: number
}

export class AssetPreprocessor {
  private static instance: AssetPreprocessor | null = null

  private isOnMobile: boolean

  private constructor() {
    this.isOnMobile = isMobileClient()
  }

  static getInstance(): AssetPreprocessor {
    if (!AssetPreprocessor.instance) {
      AssetPreprocessor.instance = new AssetPreprocessor()
    }
    return AssetPreprocessor.instance
  }

  static resetInstance(): void {
    AssetPreprocessor.instance = null
  }

  getTextureFormat(): TextureFormat {
    return this.isOnMobile ? 'webp' : 'png'
  }

  getMaxTextureResolution(): number {
    return this.isOnMobile ? 512 : 2048
  }

  getMeshQuality(): MeshQuality {
    return this.isOnMobile ? 'medium' : 'high'
  }

  getLODDistances(): LODDistances {
    if (this.isOnMobile) {
      return { near: 5, medium: 10, far: 15 }
    }
    return { near: 10, medium: 20, far: 30 }
  }

  shouldCompressTexture(): boolean {
    return this.isOnMobile
  }

  getAtlasSize(): number {
    return this.isOnMobile ? 1024 : 2048
  }

  clampTextureSize(width: number, height: number): { width: number; height: number } {
    const max = this.getMaxTextureResolution()
    const edge = Math.max(width, height)
    if (edge <= max) return { width, height }
    const scale = max / edge
    return {
      width: Math.max(1, Math.round(width * scale)),
      height: Math.max(1, Math.round(height * scale)),
    }
  }
}
