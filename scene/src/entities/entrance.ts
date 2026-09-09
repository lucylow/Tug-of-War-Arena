import { Billboard, Entity, TextShape, Transform, engine } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

import { getCrewChoicePosition, getEntrancePosition } from '../logic/journey'
import { roundTitle } from '../logic/round'
import { POINTER_MAX_DISTANCE } from '../logic/mobileRuntime'
import type { CrewId } from '../logic/mapping'
import { cloud, crewColor, gold, midnight } from '../palette'
import { setupInteraction } from '../systems/interaction'
import { box, cylinder } from './primitives'

export function createEntrance(onJoin: (crew: CrewId) => void): Entity {
  const pos = getEntrancePosition()
  const root = engine.addEntity()
  Transform.create(root, { position: Vector3.create(pos.x, pos.y, pos.z) })

  cylinder(root, { x: -2.4, y: 1.7, z: 0 }, { x: 0.22, y: 1.7, z: 0.22 }, midnight, { metallic: 0.4, roughness: 0.3 })
  cylinder(root, { x: 2.4, y: 1.7, z: 0 }, { x: 0.22, y: 1.7, z: 0.22 }, midnight, { metallic: 0.4, roughness: 0.3 })
  box(root, { x: 0, y: 3.45, z: 0 }, { x: 5.4, y: 0.28, z: 0.4 }, gold, {
    emissive: gold,
    emissiveIntensity: 1.4,
  })

  const title = engine.addEntity()
  Transform.create(title, {
    parent: root,
    position: Vector3.create(0, 4.15, 0),
  })
  TextShape.create(title, { text: roundTitle(), fontSize: 1.8, textColor: gold })
  Billboard.create(title)

  const hint = engine.addEntity()
  Transform.create(hint, {
    parent: root,
    position: Vector3.create(0, 3.75, 0),
  })
  TextShape.create(hint, { text: 'PICK A CREW', fontSize: 1.1, textColor: cloud })
  Billboard.create(hint)

  createCrewPad('sun', onJoin)
  createCrewPad('moon', onJoin)
  return root
}

function createCrewPad(crew: CrewId, onJoin: (crew: CrewId) => void): Entity {
  const pos = getCrewChoicePosition(crew)
  const color = crewColor(crew)
  const pad = box(undefined, pos, { x: 2.2, y: 0.2, z: 2.2 }, color, {
    emissive: color,
    emissiveIntensity: 1.1,
    collider: true,
  })
  const label = engine.addEntity()
  Transform.create(label, { position: Vector3.create(pos.x, 1.15, pos.z) })
  TextShape.create(label, {
    text: crew === 'sun' ? 'SUN CREW' : 'MOON CREW',
    fontSize: 1.2,
    textColor: cloud,
  })
  Billboard.create(label)
  setupInteraction(pad, () => onJoin(crew), `Join ${crew === 'sun' ? 'Sun' : 'Moon'} Crew`, POINTER_MAX_DISTANCE)
  return pad
}
