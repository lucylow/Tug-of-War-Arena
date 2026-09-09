import { Entity, Transform, engine } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

import { getCrewBasePosition } from '../logic/journey'
import type { CrewId } from '../logic/mapping'
import { crewColor, midnight, withAlpha } from '../palette'
import { box } from './primitives'

export function createCrewBases(): Entity[] {
  return [createCrewBase('sun'), createCrewBase('moon')]
}

function createCrewBase(crew: CrewId): Entity {
  const pos = getCrewBasePosition(crew)
  const root = engine.addEntity()
  Transform.create(root, { position: Vector3.create(pos.x, pos.y, pos.z) })
  const color = crewColor(crew)

  box(root, { x: 0, y: 0.22, z: 0 }, { x: 4.4, y: 0.44, z: 4.4 }, midnight, { roughness: 0.85 })
  box(root, { x: 0, y: 0.46, z: 0 }, { x: 4.1, y: 0.08, z: 4.1 }, withAlpha(color, 0.85), {
    emissive: color,
    emissiveIntensity: 0.7,
  })
  box(root, { x: crew === 'sun' ? -1.9 : 1.9, y: 0.7, z: 0 }, { x: 0.18, y: 0.5, z: 3.6 }, color, {
    emissive: color,
    emissiveIntensity: 1.1,
  })
  return root
}
