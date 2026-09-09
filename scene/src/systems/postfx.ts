import { Entity, MeshRenderer, Transform, engine } from '@dcl/sdk/ecs'
import { Color4, Vector3 } from '@dcl/sdk/math'

import { ARENA_CENTER } from '../logic/mapping'
import { gold, withAlpha } from '../palette'
import { pbrMaterial } from '../entities/primitives'
import { registerQualityBloom } from './quality'

/**
 * SDK 7 has no engine-wide bloom/vignette pass. Glow is simulated with
 * additive-looking emissive orbs parented to bright props.
 */
export function addGlowEffect(entity: Entity, intensity: number = 0.5): Entity {
  const glow = engine.addEntity()
  const source = Transform.get(entity)
  Transform.create(glow, {
    position: Vector3.create(source.position.x, source.position.y + 0.2, source.position.z),
    scale: Vector3.create(1.8 * intensity + 0.6, 1.8 * intensity + 0.6, 1.8 * intensity + 0.6),
  })
  MeshRenderer.setSphere(glow)
  pbrMaterial(glow, withAlpha(gold, 0.08 * intensity), {
    emissive: gold,
    emissiveIntensity: 1.6 * intensity,
    metallic: 0,
    roughness: 1,
    meshKey: 'sphere',
  })
  return glow
}

export function createCenterBloom(): Entity {
  const bloom = engine.addEntity()
  Transform.create(bloom, {
    position: Vector3.create(ARENA_CENTER.x, 1.7, ARENA_CENTER.z),
    scale: Vector3.create(1.4, 1.4, 1.4),
  })
  MeshRenderer.setSphere(bloom)
  pbrMaterial(bloom, Color4.create(1, 0.85, 0.4, 0.08), {
    emissive: gold,
    emissiveIntensity: 1.8,
    roughness: 1,
    meshKey: 'sphere',
  })
  registerQualityBloom(bloom)
  return bloom
}
