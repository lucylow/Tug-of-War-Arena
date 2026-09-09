/**
 * LODSystem switches mesh / scale by camera distance.
 * On mobile, distances are compressed so high-poly meshes drop sooner.
 */

import { isMobileClient } from '../performance/platform'
import { AssetPreprocessor } from './AssetPreprocessor'
import type { EntityId, LODChange, LODLevel, Vec3Like } from './types'
import { vecDistance } from './types'

export interface LODGroup {
  levels: LODLevel[]
  currentLevel: number
  position: Vec3Like
  originalScale: Vec3Like
}

export type LODListener = (change: LODChange) => void

export class LODSystem {
  private static instance: LODSystem | null = null

  private lodGroups: Map<EntityId, LODGroup> = new Map()
  private updateInterval = 1000
  private lastUpdate = 0
  private cameraPosition: Vec3Like = { x: 0, y: 2, z: 10 }
  private listeners: LODListener[] = []

  private constructor() {}

  static getInstance(): LODSystem {
    if (!LODSystem.instance) {
      LODSystem.instance = new LODSystem()
    }
    return LODSystem.instance
  }

  static resetInstance(): void {
    LODSystem.instance = null
  }

  onLevelChange(callback: LODListener): void {
    this.listeners.push(callback)
  }

  registerLOD(entity: EntityId, levels: LODLevel[], position: Vec3Like, originalScale: Vec3Like = { x: 1, y: 1, z: 1 }): void {
    const sorted = [...levels].sort((a, b) => a.distance - b.distance)
    this.lodGroups.set(entity, {
      levels: sorted,
      currentLevel: 0,
      position: { ...position },
      originalScale: { ...originalScale },
    })
  }

  unregister(entity: EntityId): void {
    this.lodGroups.delete(entity)
  }

  setPosition(entity: EntityId, position: Vec3Like): void {
    const group = this.lodGroups.get(entity)
    if (group) group.position = { ...position }
  }

  setCameraPosition(position: Vec3Like): void {
    this.cameraPosition = { ...position }
  }

  getCurrentLOD(entity: EntityId): number {
    return this.lodGroups.get(entity)?.currentLevel ?? 0
  }

  getRegistered(): EntityId[] {
    return [...this.lodGroups.keys()]
  }

  tick(now: number = Date.now(), camera?: Vec3Like): LODChange[] {
    if (now - this.lastUpdate < this.updateInterval) return []
    this.lastUpdate = now
    if (camera) this.cameraPosition = { ...camera }
    return this.updateAllLODs()
  }

  forceUpdate(camera?: Vec3Like): LODChange[] {
    this.lastUpdate = 0
    if (camera) this.cameraPosition = { ...camera }
    return this.updateAllLODs()
  }

  setUpdateInterval(ms: number): void {
    this.updateInterval = Math.max(100, ms)
  }

  private updateAllLODs(): LODChange[] {
    const changes: LODChange[] = []

    for (const [entity, group] of this.lodGroups) {
      const distance = vecDistance(group.position, this.cameraPosition)
      let newLevel = 0
      for (let index = 0; index < group.levels.length; index += 1) {
        const level = group.levels[index]
        if (level && distance >= level.distance) newLevel = index
      }
      newLevel = Math.min(newLevel, group.levels.length - 1)

      if (newLevel === group.currentLevel) continue
      const applied = this.applyLOD(entity, group, newLevel)
      if (applied) {
        group.currentLevel = newLevel
        changes.push(applied)
        for (const listener of this.listeners) listener(applied)
      }
    }

    return changes
  }

  private applyLOD(entity: EntityId, group: LODGroup, level: number): LODChange | null {
    const lodLevel = group.levels[level]
    if (!lodLevel) return null
    const mobileScale = isMobileClient() ? 0.9 : 1
    const scale = group.originalScale.x * lodLevel.scale * mobileScale
    return {
      entity,
      previousLevel: group.currentLevel,
      level,
      mesh: lodLevel.mesh,
      scale,
    }
  }

  defaultLevels(highMesh: string, mediumMesh = highMesh, lowMesh = highMesh): LODLevel[] {
    const distances = AssetPreprocessor.getInstance().getLODDistances()
    return [
      { distance: 0, mesh: highMesh, scale: 1 },
      { distance: distances.near, mesh: mediumMesh, scale: 0.9 },
      { distance: distances.medium, mesh: lowMesh, scale: 0.75 },
    ]
  }
}
