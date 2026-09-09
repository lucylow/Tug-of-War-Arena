import { Billboard, Entity, TextShape, Transform, engine } from '@dcl/sdk/ecs'
import { Color4, Quaternion, Vector3 } from '@dcl/sdk/math'

import { MODELS } from '../config'
import { getFlagPosition, normalizeTeam, type TeamAlias } from '../logic/mapping'
import { cloud, crewColor, midnight } from '../palette'
import { attachModelOrFallback, box, cylinder, plane } from './primitives'

export function createFlags(): Entity[] {
  return [createFlag('sun'), createFlag('moon')]
}

function createFlag(team: TeamAlias): Entity {
  const crew = normalizeTeam(team)
  const pos = getFlagPosition(crew)
  const root = engine.addEntity()
  Transform.create(root, { position: Vector3.create(pos.x, pos.y, pos.z) })

  attachModelOrFallback(root, crew === 'sun' ? MODELS.flagSun : MODELS.flagMoon, () => {
    cylinder(root, { x: 0, y: 2.1, z: 0 }, { x: 0.08, y: 2.1, z: 0.08 }, midnight, { metallic: 0.4, roughness: 0.3 })
    plane(
      root,
      { x: crew === 'sun' ? -0.85 : 0.85, y: 3.35, z: 0 },
      { x: 1.7, y: 1.05, z: 1 },
      crewColor(crew),
      Quaternion.fromEulerDegrees(0, 90, 0),
    )
    box(root, { x: 0, y: 0.12, z: 0 }, { x: 0.7, y: 0.24, z: 0.7 }, midnight)
  })

  const label = engine.addEntity()
  Transform.create(label, {
    parent: root,
    position: Vector3.create(0, 4.15, 0),
  })
  TextShape.create(label, {
    text: crew === 'sun' ? 'SUN CREW' : 'MOON CREW',
    fontSize: 1.6,
    textColor: cloud,
  })
  Billboard.create(label)

  return root
}
