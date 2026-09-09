import { Entity, MeshCollider, Transform, engine } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

import { MODELS } from '../config'
import { crewColor, midnight, sun } from '../palette'
import { setupInteraction } from '../systems/interaction'
import { attachModelOrFallback, box, cylinder, setEmissiveMaterial, sphere } from './primitives'

export type DummyHandle = {
  root: Entity
  body: Entity
  team: 'sun' | 'moon'
}

let dummyState: DummyHandle | null = null

export function createInteractiveDummy(position: Vector3): DummyHandle {
  const root = engine.addEntity()
  Transform.create(root, { position, scale: Vector3.create(1, 1, 1) })
  MeshCollider.setBox(root)

  let body = root
  attachModelOrFallback(root, MODELS.dummy, () => {
    box(root, { x: 0, y: 0.12, z: 0 }, { x: 0.7, y: 0.24, z: 0.7 }, midnight, { collider: true })
    body = cylinder(root, { x: 0, y: 1.05, z: 0 }, { x: 0.32, y: 0.85, z: 0.32 }, sun, {
      emissive: sun,
      emissiveIntensity: 0.7,
      collider: true,
    })
    sphere(root, { x: 0, y: 2.05, z: 0 }, { x: 0.28, y: 0.28, z: 0.28 }, midnight)
    box(root, { x: 0.55, y: 1.15, z: 0 }, { x: 0.55, y: 0.16, z: 0.16 }, midnight)
    box(root, { x: -0.55, y: 1.15, z: 0 }, { x: 0.55, y: 0.16, z: 0.16 }, midnight)
  })

  const handle: DummyHandle = { root, body, team: 'sun' }
  dummyState = handle
  setupInteraction(root, () => toggleDummyTeam(handle), 'Practice dummy')
  return handle
}

export function toggleDummyTeam(handle: DummyHandle | null = dummyState): DummyHandle | null {
  if (!handle) return null
  handle.team = handle.team === 'sun' ? 'moon' : 'sun'
  const color = crewColor(handle.team)
  setEmissiveMaterial(handle.body, color, 1.1, { emissive: color, roughness: 0.4 })
  return handle
}

export function getDummyTeam(): 'sun' | 'moon' {
  return dummyState?.team ?? 'sun'
}
