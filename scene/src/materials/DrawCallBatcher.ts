/**
 * DrawCallBatcher groups entities that share a material + mesh so we can
 * estimate post-batch draw calls. SDK7 batches identical PBR automatically
 * when definitions match — this tracker is how we stay under the mobile cap.
 *
 * @see https://docs.decentraland.org/creator/build-for-mobile/develop/optimize-performance#reduce-draw-calls
 */

import type { EntityId, MeshKey } from './types'

export interface BatchStats {
  totalGroups: number
  totalEntities: number
  estimatedDrawCalls: number
  largestGroup: number
}

export class DrawCallBatcher {
  private static instance: DrawCallBatcher | null = null

  private batchedGroups: Map<string, EntityId[]> = new Map()

  private constructor() {}

  static getInstance(): DrawCallBatcher {
    if (!DrawCallBatcher.instance) {
      DrawCallBatcher.instance = new DrawCallBatcher()
    }
    return DrawCallBatcher.instance
  }

  static resetInstance(): void {
    DrawCallBatcher.instance = null
  }

  registerEntity(entity: EntityId, materialKey: string, meshKey: MeshKey | string): void {
    const key = `${materialKey}_${meshKey}`
    const group = this.batchedGroups.get(key)
    if (group) {
      if (!group.includes(entity)) group.push(entity)
      return
    }
    this.batchedGroups.set(key, [entity])
  }

  batch(): BatchStats {
    const stats = this.getStats()
    let totalBatched = 0
    for (const [key, entities] of this.batchedGroups) {
      if (entities.length > 1) {
        totalBatched += entities.length
        console.log(`[Batcher] Batched ${entities.length} entities with key: ${key}`)
      }
    }
    console.log(`[Batcher] Total batched entities: ${totalBatched} across ${stats.totalGroups} groups`)
    return stats
  }

  clear(): void {
    this.batchedGroups.clear()
  }

  getStats(): BatchStats {
    let totalEntities = 0
    let largestGroup = 0
    for (const entities of this.batchedGroups.values()) {
      totalEntities += entities.length
      if (entities.length > largestGroup) largestGroup = entities.length
    }
    return {
      totalGroups: this.batchedGroups.size,
      totalEntities,
      estimatedDrawCalls: this.batchedGroups.size,
      largestGroup,
    }
  }

  groupFor(materialKey: string, meshKey: MeshKey | string): EntityId[] {
    return this.batchedGroups.get(`${materialKey}_${meshKey}`) ?? []
  }
}
