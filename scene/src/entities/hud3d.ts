import { Billboard, Entity, MeshRenderer, TextShape, Transform, engine } from '@dcl/sdk/ecs'
import { Color4, Vector3 } from '@dcl/sdk/math'

import { ARENA_CENTER, formatScore, formatTimer, powerBarWidth, type CrewId } from '../logic/mapping'
import { roundStatusCopy, roundTitle, toWorldPhase } from '../logic/round'
import type { ArenaVisualState } from '../logic/snapshot'
import { cloud, gold, midnight, moon, sun } from '../palette'
import { pbrMaterial } from './primitives'

export type Hud3D = {
  title: Entity
  status: Entity
  timer: Entity
  score: Entity
  sunBar: Entity
  moonBar: Entity
}

export function createHud3D(): Hud3D {
  const title = label({ x: ARENA_CENTER.x, y: 7.05, z: ARENA_CENTER.z }, roundTitle(), gold, 1.7)
  const timer = label({ x: ARENA_CENTER.x, y: 6.2, z: ARENA_CENTER.z }, '0:30', gold)
  const score = label({ x: ARENA_CENTER.x, y: 5.45, z: ARENA_CENTER.z }, '0 – 0', cloud)
  const status = label(
    { x: ARENA_CENTER.x, y: 5.05, z: ARENA_CENTER.z },
    roundStatusCopy('lobby', null),
    cloud,
    1.1,
  )

  const sunBar = bar({ x: ARENA_CENTER.x - 4.4, y: 4.55, z: ARENA_CENTER.z }, sun)
  const moonBar = bar({ x: ARENA_CENTER.x + 4.4, y: 4.55, z: ARENA_CENTER.z }, moon)

  return { title, status, timer, score, sunBar, moonBar }
}

function label(
  position: { x: number; y: number; z: number },
  text: string,
  color: Color4,
  fontSize: number = 2.4,
): Entity {
  const entity = engine.addEntity()
  Transform.create(entity, { position: Vector3.create(position.x, position.y, position.z) })
  TextShape.create(entity, { text, fontSize, textColor: color })
  Billboard.create(entity)
  return entity
}

function bar(position: { x: number; y: number; z: number }, color: Color4): Entity {
  const bg = engine.addEntity()
  Transform.create(bg, {
    position: Vector3.create(position.x, position.y, position.z),
    scale: Vector3.create(3.2, 0.22, 0.22),
  })
  MeshRenderer.setBox(bg)
  pbrMaterial(bg, midnight, { roughness: 0.8, meshKey: 'box' })

  const fill = engine.addEntity()
  Transform.create(fill, {
    parent: bg,
    position: Vector3.create(0, 0, 0.12),
    scale: Vector3.create(0.2, 0.7, 0.7),
  })
  MeshRenderer.setBox(fill)
  pbrMaterial(fill, color, { emissive: color, emissiveIntensity: 1.6, meshKey: 'box' })
  return fill
}

export function updateHud3D(hud: Hud3D, input: {
  timeRemaining: number
  sunScore: number
  moonScore: number
  sunPower: number
  moonPower: number
  phase?: ArenaVisualState['phase']
  winner?: CrewId | null
}) {
  TextShape.getMutable(hud.title).text = roundTitle()
  TextShape.getMutable(hud.timer).text = formatTimer(input.timeRemaining)
  TextShape.getMutable(hud.score).text = formatScore(input.sunScore, input.moonScore)
  if (input.phase) {
    TextShape.getMutable(hud.status).text = roundStatusCopy(toWorldPhase(input.phase), input.winner ?? null)
  }

  const sunWidth = powerBarWidth(input.sunPower, 1)
  const moonWidth = powerBarWidth(input.moonPower, 1)
  Transform.getMutable(hud.sunBar).scale = Vector3.create(sunWidth, 0.7, 0.7)
  Transform.getMutable(hud.moonBar).scale = Vector3.create(moonWidth, 0.7, 0.7)
}
