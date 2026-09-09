/**
 * OcclusionCuller hides entities outside the camera radius or behind the view
 * cone. Gameplay-critical props should not be registered.
 *
 * Visibility is a flag — never scale to zero (that fights LOD and animations).
 */

import { isMobileClient } from '../performance/platform'
import type { CameraPose, CullChange, EntityId, Vec3Like } from './types'
import { vecDistance, vecDot, vecNormalize, vecSubtract } from './types'

export type VisibilityListener = (change: CullChange) => void

interface CulledRecord {
  position: Vec3Like
  important: boolean
}

export class OcclusionCuller {
  private static instance: OcclusionCuller | null = null

  private entities: Map<EntityId, CulledRecord> = new Map()
  private culledEntities: Set<EntityId> = new Set()
  private cullingDistance: number
  private checkInterval = 1000
  private lastCheck = 0
  private frustumDot = -0.1
  private listeners: VisibilityListener[] = []

  private constructor() {
    this.cullingDistance = isMobileClient() ? 15 : 20
  }

  static getInstance(): OcclusionCuller {
    if (!OcclusionCuller.instance) {
      OcclusionCuller.instance = new OcclusionCuller()
    }
    return OcclusionCuller.instance
  }

  static resetInstance(): void {
    OcclusionCuller.instance = null
  }

  register(entity: EntityId, position: Vec3Like, important: boolean = false): void {
    this.entities.set(entity, { position: { ...position }, important })
  }

  unregister(entity: EntityId): void {
    this.entities.delete(entity)
    this.culledEntities.delete(entity)
  }

  setPosition(entity: EntityId, position: Vec3Like): void {
    const record = this.entities.get(entity)
    if (record) record.position = { ...position }
  }

  onVisibility(callback: VisibilityListener): void {
    this.listeners.push(callback)
  }

  tick(now: number = Date.now(), camera?: CameraPose): CullChange[] {
    if (now - this.lastCheck < this.checkInterval) return []
    this.lastCheck = now
    return this.cull(camera)
  }

  forceCull(camera?: CameraPose): CullChange[] {
    this.lastCheck = 0
    return this.cull(camera)
  }

  setCullingDistance(distance: number): void {
    this.cullingDistance = Math.max(1, distance)
  }

  getCullingDistance(): number {
    return this.cullingDistance
  }

  isCulled(entity: EntityId): boolean {
    return this.culledEntities.has(entity)
  }

  getRegistered(): EntityId[] {
    return [...this.entities.keys()]
  }

  reset(): void {
    const changes: CullChange[] = []
    for (const entity of this.culledEntities) {
      const change: CullChange = { entity, visible: true, reason: 'restored' }
      changes.push(change)
      for (const listener of this.listeners) listener(change)
    }
    this.culledEntities.clear()
  }

  setCheckInterval(ms: number): void {
    this.checkInterval = Math.max(100, ms)
  }

  private cull(camera?: CameraPose): CullChange[] {
    const pose: CameraPose = camera ?? {
      position: { x: 0, y: 2, z: 10 },
      direction: { x: 0, y: 0, z: -1 },
    }
    const changes: CullChange[] = []

    for (const [entity, record] of this.entities) {
      if (record.important) {
        if (this.culledEntities.has(entity)) {
          this.culledEntities.delete(entity)
          const change: CullChange = { entity, visible: true, reason: 'restored' }
          changes.push(change)
          for (const listener of this.listeners) listener(change)
        }
        continue
      }

      const distance = vecDistance(record.position, pose.position)
      const toEntity = vecSubtract(record.position, pose.position)
      const facing = vecDot(vecNormalize(toEntity), vecNormalize(pose.direction))
      const inRange = distance < this.cullingDistance
      const inFrustum = dotSafe(facing) > this.frustumDot
      const isVisible = inRange && inFrustum

      if (!isVisible && !this.culledEntities.has(entity)) {
        this.culledEntities.add(entity)
        const change: CullChange = {
          entity,
          visible: false,
          reason: inRange ? 'frustum' : 'distance',
        }
        changes.push(change)
        for (const listener of this.listeners) listener(change)
      } else if (isVisible && this.culledEntities.has(entity)) {
        this.culledEntities.delete(entity)
        const change: CullChange = { entity, visible: true, reason: 'restored' }
        changes.push(change)
        for (const listener of this.listeners) listener(change)
      }
    }

    return changes
  }
}

function dotSafe(value: number): number {
  return Number.isFinite(value) ? value : -1
}
