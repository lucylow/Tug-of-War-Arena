import { Entity, Transform, engine } from '@dcl/sdk/ecs'
import { Color4, Vector3 } from '@dcl/sdk/math'

import { SceneErrorHandler } from '../systems/errorHandling'

/**
 * Safely load a GLB model with error handling and a primitive fallback.
 */
export function safeLoadModel(
  entity: Entity,
  src: string,
  fallbackSrc = '',
  position: Vector3 = Vector3.create(0, 0, 0),
  scale: Vector3 = Vector3.create(1, 1, 1),
): void {
  Transform.create(entity, { position, scale })
  SceneErrorHandler.getInstance().safeLoadGltf(entity, src, fallbackSrc)
}

export function createPlaceholderEntity(
  position: Vector3,
  color: Color4 = Color4.create(0.8, 0.2, 0.2, 1),
): Entity {
  const entity = engine.addEntity()
  Transform.create(entity, { position })
  SceneErrorHandler.getInstance().safeLoadGltf(entity, '', '')
  void color
  return entity
}
