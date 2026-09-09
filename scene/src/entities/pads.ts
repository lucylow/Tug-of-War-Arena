import { Billboard, Entity, TextShape, Transform, engine } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

import { getPullPadPosition, getRematchPadPosition } from '../logic/journey'
import { POINTER_MAX_DISTANCE } from '../logic/mobileRuntime'
import { cloud, gold, midnight } from '../palette'
import { setupInteraction } from '../systems/interaction'
import { box } from './primitives'

export type MatchPads = {
  pull: Entity
  rematch: Entity
}

export function createMatchPads(onPull: () => void, onRematch: () => void): MatchPads {
  const pullPos = getPullPadPosition()
  const rematchPos = getRematchPadPosition()

  const pull = box(undefined, pullPos, { x: 4.4, y: 0.18, z: 2.2 }, midnight, {
    emissive: midnight,
    emissiveIntensity: 0.4,
    collider: true,
  })
  labelAt(pullPos.x, 0.85, pullPos.z, 'PULL', gold)
  setupInteraction(pull, onPull, 'Pull!', POINTER_MAX_DISTANCE)

  const rematch = box(undefined, rematchPos, { x: 2.2, y: 0.18, z: 2.2 }, gold, {
    emissive: gold,
    emissiveIntensity: 1.2,
    collider: true,
  })
  labelAt(rematchPos.x, 0.85, rematchPos.z, 'REMATCH', cloud)
  setupInteraction(rematch, onRematch, 'Rematch', POINTER_MAX_DISTANCE)

  return { pull, rematch }
}

function labelAt(x: number, y: number, z: number, text: string, color: typeof gold): Entity {
  const entity = engine.addEntity()
  Transform.create(entity, { position: Vector3.create(x, y, z) })
  TextShape.create(entity, { text, fontSize: 1.3, textColor: color })
  Billboard.create(entity)
  return entity
}
