import { Billboard, Entity, TextShape, Transform, engine } from '@dcl/sdk/ecs'
import { Color4, Vector3 } from '@dcl/sdk/math'

export function worldLabel(text: string, position: Vector3, fontSize = 1.6, color = Color4.create(0.96, 0.97, 1, 1)): Entity {
  const entity = engine.addEntity()
  try {
    Transform.create(entity, { position })
    TextShape.create(entity, { text, fontSize, textColor: color })
    Billboard.create(entity)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown'
    console.error(`[world] label failed: ${message}`)
  }
  return entity
}

export function setLabelText(entity: Entity, text: string): void {
  try {
    const shape = TextShape.getMutableOrNull(entity)
    if (shape) shape.text = text
  } catch {
    // TextShape can be missing after entity teardown.
  }
}
