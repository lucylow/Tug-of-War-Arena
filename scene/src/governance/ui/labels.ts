import { Billboard, Entity, TextShape, Transform, engine } from '@dcl/sdk/ecs'
import type { Color4 } from '@dcl/sdk/math'
import { Vector3 } from '@dcl/sdk/math'

import { GOVERNANCE_COLORS } from '../visual/materialFactory'

export function addGovernanceLabel(
  text: string,
  position: Vector3,
  size = 0.55,
  color: Color4 = GOVERNANCE_COLORS.white,
  parent?: Entity,
): Entity {
  const entity = engine.addEntity()
  Transform.create(entity, {
    parent,
    position,
  })
  Billboard.create(entity)
  TextShape.create(entity, {
    text,
    fontSize: size,
    textColor: color,
  })
  return entity
}

export function updateGovernanceLabel(entity: Entity, text: string): void {
  TextShape.getMutable(entity).text = text
}
