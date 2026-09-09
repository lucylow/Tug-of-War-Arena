import { Transform, engine } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

import { lodTier } from '../logic/visualFx'
import { sampleCamera } from './overdraw'

/**
 * Runtime LOD tick. Mesh swaps are applied in `overdraw.ts`; this helper
 * exposes distance tiers for props that only scale (torches, trees).
 */
export function updateLOD(entity: ReturnType<typeof engine.addEntity>, distance: number): ReturnType<typeof lodTier> {
  const tier = lodTier(distance)
  if (!Transform.has(entity)) return tier
  const scale = tier === 'high' ? 1 : tier === 'medium' ? 0.9 : 0.75
  const transform = Transform.getMutable(entity)
  transform.scale = Vector3.create(scale, scale, scale)
  return tier
}

export function cameraDistanceTo(entity: ReturnType<typeof engine.addEntity>): number {
  const camera = sampleCamera()
  if (!camera || !Transform.has(entity)) return 0
  const position = Transform.get(entity).position
  const dx = position.x - camera.position.x
  const dy = position.y - camera.position.y
  const dz = position.z - camera.position.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

export function tickPropLod(entities: Array<ReturnType<typeof engine.addEntity>>): void {
  for (const entity of entities) {
    updateLOD(entity, cameraDistanceTo(entity))
  }
}
