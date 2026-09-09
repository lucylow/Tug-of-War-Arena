import { Entity, MeshRenderer, Transform, engine } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

import { GOVERNANCE_COLORS, paint } from '../visual/materialFactory'
import { addGovernanceLabel } from './labels'

export function createGovernanceBadges(position: Vector3): Entity[] {
  const labels = [
    { text: 'DISCUSS', color: GOVERNANCE_COLORS.pink },
    { text: 'REVIEW', color: GOVERNANCE_COLORS.purple },
    { text: 'VOTE', color: GOVERNANCE_COLORS.sun },
  ]

  return labels.map((item, index) => {
    const entity = engine.addEntity()
    Transform.create(entity, {
      position: Vector3.create(position.x - 1.85 + index * 1.85, position.y, position.z),
      scale: Vector3.create(1.4, 0.22, 0.55),
    })
    MeshRenderer.setBox(entity)
    paint(entity, item.color, { emissive: item.color, emissiveIntensity: 0.9 })
    addGovernanceLabel(
      item.text,
      Vector3.create(position.x - 1.85 + index * 1.85, position.y + 0.28, position.z),
      0.28,
      GOVERNANCE_COLORS.white,
    )
    return entity
  })
}
