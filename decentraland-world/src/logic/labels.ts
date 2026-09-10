import { Billboard, Entity, TextShape, Transform, engine } from '@dcl/sdk/ecs'
import { Color4, Vector3 } from '@dcl/sdk/math'

import { cloud } from '../palette'

export function worldLabel(position: { x: number; y: number; z: number }, text: string, color: Color4 = cloud, fontSize = 1.2): Entity {
  const entity = engine.addEntity()
  Transform.create(entity, { position: Vector3.create(position.x, position.y, position.z) })
  TextShape.create(entity, { text: truncate(text), fontSize, textColor: color })
  Billboard.create(entity)
  return entity
}

export function setLabel(entity: Entity, text: string): void {
  if (!TextShape.has(entity)) return
  TextShape.getMutable(entity).text = truncate(text)
}

export function truncate(text: string, max = 48): string {
  const value = String(text ?? '').replace(/[\u0000-\u001F]/g, '').trim()
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`
}
