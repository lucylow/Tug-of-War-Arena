import { Entity, Transform, engine } from '@dcl/sdk/ecs'
import { Color4, Vector3 } from '@dcl/sdk/math'

import { MODELS } from '../config'
import { getWinZonePosition, normalizeTeam, pulseScale, type TeamAlias } from '../logic/mapping'
import { crewColor, gold, withAlpha } from '../palette'
import { attachModelOrFallback, box, sphere } from './primitives'

type ZoneRecord = { root: Entity; pad: Entity; team: ReturnType<typeof normalizeTeam> }

const zones: ZoneRecord[] = []

export function createWinZones(): Entity[] {
  zones.length = 0
  return [createZone('sun'), createZone('moon')]
}

function createZone(team: TeamAlias): Entity {
  const crew = normalizeTeam(team)
  const pos = getWinZonePosition(crew)
  const root = engine.addEntity()
  Transform.create(root, {
    position: Vector3.create(pos.x, pos.y, pos.z),
  })

  const pad = engine.addEntity()
  Transform.create(pad, {
    parent: root,
    scale: Vector3.create(2.4, 0.18, 7.2),
  })

  attachModelOrFallback(root, crew === 'sun' ? MODELS.winZoneSun : MODELS.winZoneMoon, () => {
    box(pad, { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }, withAlpha(crewColor(crew), 0.9), {
      emissive: crewColor(crew),
      emissiveIntensity: 1.9,
    })
    sphere(root, { x: 0, y: 1.35, z: 0 }, { x: 0.48, y: 0.48, z: 0.48 }, withAlpha(gold, 0.22), {
      emissive: gold,
      emissiveIntensity: 1.2,
    })
  })

  zones.push({ root, pad, team: crew })
  return root
}

export function updateWinZones(time: number) {
  for (const zone of zones) {
    const transform = Transform.getMutable(zone.pad)
    const pulse = pulseScale(time + (zone.team === 'sun' ? 0 : 1.1), 0.1)
    transform.scale = Vector3.create(2.4 * pulse, 0.18, 7.2)
  }
}
