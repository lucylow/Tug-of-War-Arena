/**
 * TextureAtlasManager packs sprite / decal UVs into a single atlas.
 * Runtime packing is UV-only; bake the image at build time and sample with getUVs().
 *
 * @see https://docs.decentraland.org/creator/sdk7/optimizing/performance-optimization#textures
 */

import { isMobileClient } from '../performance/platform'
import type { AtlasSlot, AtlasUVs } from './types'

export interface AtlasStats {
  count: number
  usedPixels: number
  occupancy: number
  size: number
  maxEdge: number
}

export class TextureAtlasManager {
  private static instance: TextureAtlasManager | null = null

  private atlases: Map<string, Map<string, AtlasSlot>> = new Map()
  private maxAtlasSize: number
  private cursorX = 0
  private cursorY = 0
  private rowHeight = 0
  private usedPixels = 0
  private maxEdge = 0
  private defaultKey = 'arena'

  private constructor() {
    this.maxAtlasSize = isMobileClient() ? 1024 : 2048
    this.atlases.set(this.defaultKey, new Map())
  }

  static getInstance(): TextureAtlasManager {
    if (!TextureAtlasManager.instance) {
      TextureAtlasManager.instance = new TextureAtlasManager()
    }
    return TextureAtlasManager.instance
  }

  static resetInstance(): void {
    TextureAtlasManager.instance = null
  }

  getMaxAtlasSize(): number {
    return this.maxAtlasSize
  }

  /**
   * Register a texture for atlas packing. Oversized sources are clamped to the
   * platform atlas edge so a 2K source still contributes a mobile UV rect.
   */
  registerTexture(name: string, width: number, height: number, atlasKey: string = this.defaultKey): AtlasSlot | null {
    const atlas = this.ensureAtlas(atlasKey)
    const existing = atlas.get(name)
    if (existing) return existing

    const packedWidth = Math.max(1, Math.min(Math.ceil(width), this.maxAtlasSize))
    const packedHeight = Math.max(1, Math.min(Math.ceil(height), this.maxAtlasSize))

    if (this.cursorX + packedWidth > this.maxAtlasSize) {
      this.cursorX = 0
      this.cursorY += this.rowHeight
      this.rowHeight = 0
    }

    if (this.cursorY + packedHeight > this.maxAtlasSize) {
      console.log(`[TextureAtlas] ${name} does not fit in ${this.maxAtlasSize}x${this.maxAtlasSize}`)
      return null
    }

    const slot: AtlasSlot = {
      name,
      x: this.cursorX,
      y: this.cursorY,
      width: packedWidth,
      height: packedHeight,
      uvs: this.toUVs(this.cursorX, this.cursorY, packedWidth, packedHeight),
    }

    atlas.set(name, slot)
    this.cursorX += packedWidth
    this.rowHeight = Math.max(this.rowHeight, packedHeight)
    this.usedPixels += packedWidth * packedHeight
    this.maxEdge = Math.max(this.maxEdge, packedWidth, packedHeight)
    return slot
  }

  getAtlasTexture(key: string = this.defaultKey): { src: string; size: number } | null {
    const atlas = this.atlases.get(key)
    if (!atlas || atlas.size === 0) return null
    return { src: `atlas://${key}`, size: this.maxAtlasSize }
  }

  getUVs(textureName: string, atlasKey: string = this.defaultKey): AtlasUVs | null {
    return this.atlases.get(atlasKey)?.get(textureName)?.uvs ?? null
  }

  getSlot(textureName: string, atlasKey: string = this.defaultKey): AtlasSlot | null {
    return this.atlases.get(atlasKey)?.get(textureName) ?? null
  }

  getStats(): AtlasStats {
    const count = [...this.atlases.values()].reduce((sum, atlas) => sum + atlas.size, 0)
    const capacity = this.maxAtlasSize * this.maxAtlasSize
    return {
      count,
      usedPixels: this.usedPixels,
      occupancy: capacity === 0 ? 0 : this.usedPixels / capacity,
      size: this.maxAtlasSize,
      maxEdge: this.maxEdge,
    }
  }

  clear(): void {
    this.atlases.clear()
    this.atlases.set(this.defaultKey, new Map())
    this.cursorX = 0
    this.cursorY = 0
    this.rowHeight = 0
    this.usedPixels = 0
    this.maxEdge = 0
  }

  private ensureAtlas(key: string): Map<string, AtlasSlot> {
    let atlas = this.atlases.get(key)
    if (!atlas) {
      atlas = new Map()
      this.atlases.set(key, atlas)
    }
    return atlas
  }

  private toUVs(x: number, y: number, width: number, height: number): AtlasUVs {
    return {
      uMin: x / this.maxAtlasSize,
      vMin: y / this.maxAtlasSize,
      uMax: (x + width) / this.maxAtlasSize,
      vMax: (y + height) / this.maxAtlasSize,
    }
  }
}
