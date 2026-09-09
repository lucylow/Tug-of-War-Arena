import { Entity, MeshRenderer, Transform, engine } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

import { addAmbientMotion } from '../../systems/ambient'
import { GOVERNANCE_COLORS, paint } from '../visual/materialFactory'

export function createGovernanceAccents(origin: Vector3): Entity[] {
  const entities: Entity[] = []
  for (let i = 0; i < 8; i += 1) {
    const entity = engine.addEntity()
    const x = origin.x - 5 + ((i * 1.35) % 10)
    const z = origin.z - 0.85 + (i % 3) * 0.4
    const y = origin.y + 2.55 + (i % 4) * 0.28
    Transform.create(entity, {
      position: Vector3.create(x, y, z),
      scale: Vector3.create(0.1, 0.1, 0.1),
    })
    MeshRenderer.setBox(entity)
    const color = i % 2 ? GOVERNANCE_COLORS.pink : GOVERNANCE_COLORS.purple
    paint(entity, color, { emissive: color, emissiveIntensity: 1.8 })
    addAmbientMotion(entity, 0.12, 0.15, i * 0.4, y)
    entities.push(entity)
  }
  return entities
}
