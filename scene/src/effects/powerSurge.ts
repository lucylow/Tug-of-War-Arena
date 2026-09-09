import { Entity, MeshRenderer, Transform, engine } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

import { ARENA_CENTER, normalizeTeam, type TeamAlias } from '../logic/mapping'
import {
  createPowerSurgeState,
  powerSurgeDone,
  stepPowerSurge,
  type PowerSurgeState,
} from '../logic/visualFx'
import { crewColor, gold } from '../palette'
import { setEmissiveMaterial } from '../entities/primitives'

type LiveSurge = {
  entity: Entity
  state: PowerSurgeState
}

const live: LiveSurge[] = []
const SURGE_GOLD_SCALE = 6

/**
 * Expanding ring. SDK7 has no torus primitive, so a flattened cylinder
 * reads as a shockwave when scaled on XZ.
 */
export function createPowerSurge(center: Vector3, team: TeamAlias): Entity {
  const crew = normalizeTeam(team)
  const ring = engine.addEntity()
  Transform.create(ring, {
    position: Vector3.create(center.x, center.y + 0.2, center.z),
    scale: Vector3.create(0.12, 0.08, 0.12),
  })
  MeshRenderer.setCylinder(ring)
  const color = crewColor(crew)
  setEmissiveMaterial(ring, color, 2, { emissive: color, roughness: 0.25, metallic: 0.4 })
  live.push({ entity: ring, state: createPowerSurgeState(crew) })
  return ring
}

export function createComboBurst(center: Vector3 = Vector3.create(ARENA_CENTER.x, 1.4, ARENA_CENTER.z)): Entity {
  const ring = engine.addEntity()
  Transform.create(ring, {
    position: center,
    scale: Vector3.create(0.18, 0.1, 0.18),
  })
  MeshRenderer.setCylinder(ring)
  setEmissiveMaterial(ring, gold, 2.2, { emissive: gold, roughness: 0.2, metallic: 0.5 })
  live.push({ entity: ring, state: createPowerSurgeState('sun', 6.5) })
  return ring
}

export function updatePowerSurges(dt: number): void {
  for (let i = live.length - 1; i >= 0; i -= 1) {
    const surge = live[i]
    if (!surge) continue
    surge.state = stepPowerSurge(surge.state, dt)
    if (powerSurgeDone(surge.state) || !Transform.has(surge.entity)) {
      engine.removeEntity(surge.entity)
      live.splice(i, 1)
      continue
    }
    Transform.getMutable(surge.entity).scale = Vector3.create(
      surge.state.scale,
      0.08,
      surge.state.scale,
    )
    const color = surge.state.maxScale > SURGE_GOLD_SCALE ? gold : crewColor(surge.state.team)
    setEmissiveMaterial(surge.entity, color, 0.4 + surge.state.alpha * 1.6, {
      emissive: color,
      roughness: 0.25,
    })
  }
}

export function updatePowerSurge(ring: Entity, dt: number): void {
  const found = live.find((entry) => entry.entity === ring)
  if (!found) return
  void dt
  updatePowerSurges(0)
}

export function resetPowerSurges(): void {
  for (const surge of live) {
    if (Transform.has(surge.entity)) engine.removeEntity(surge.entity)
  }
  live.length = 0
}
