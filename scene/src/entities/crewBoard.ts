import { Billboard, Entity, TextShape, Transform, engine } from '@dcl/sdk/ecs'
import { Quaternion, Vector3 } from '@dcl/sdk/math'

import { formatCrewBoardText } from '../logic/crewBoard'
import { getCrewBoardPosition } from '../logic/journey'
import { POINTER_MAX_DISTANCE } from '../logic/mobileRuntime'
import { cloud, gold, midnight } from '../palette'
import { setupInteraction } from '../systems/interaction'
import { box } from './primitives'

export type CrewBoardHandle = {
  root: Entity
  text: Entity
}

let board: CrewBoardHandle | null = null

export function createCrewBoard(onCheer: () => void): CrewBoardHandle {
  const pos = getCrewBoardPosition()
  const root = engine.addEntity()
  Transform.create(root, { position: Vector3.create(pos.x, pos.y, pos.z) })

  box(root, { x: 0, y: 3.38, z: 0 }, { x: 5, y: 0.12, z: 0.22 }, gold, {
    emissive: gold,
    emissiveIntensity: 1.2,
  })
  const panel = box(root, { x: 0, y: 1.7, z: 0 }, { x: 4.8, y: 3.2, z: 0.16 }, midnight, {
    roughness: 0.7,
    collider: true,
  })

  const text = engine.addEntity()
  Transform.create(text, {
    parent: root,
    position: Vector3.create(0, 2.05, 0.12),
    rotation: Quaternion.fromEulerDegrees(0, 180, 0),
  })
  TextShape.create(text, {
    text: formatCrewBoardText(),
    fontSize: 1.05,
    textColor: cloud,
  })
  Billboard.create(text)

  setupInteraction(panel, onCheer, 'Cheer the crew', POINTER_MAX_DISTANCE)
  board = { root, text }
  return board
}

export function updateCrewBoardText(value: string): void {
  if (!board) return
  TextShape.getMutable(board.text).text = value
}
