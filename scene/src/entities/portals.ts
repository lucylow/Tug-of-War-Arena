import { Billboard, Entity, TextShape, Transform, engine } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

import { getPortalPosition } from '../logic/journey'
import { POINTER_MAX_DISTANCE } from '../logic/mobileRuntime'
import { cloud, gold, midnight, moon, sun } from '../palette'
import { setupInteraction } from '../systems/interaction'
import { box, cylinder, sphere } from './primitives'

export type PortalKind = 'crew' | 'mobile'

export function createPortals(onPortal: (kind: PortalKind) => void): Entity[] {
  return [createPortal('crew', onPortal), createPortal('mobile', onPortal)]
}

function createPortal(kind: PortalKind, onPortal: (kind: PortalKind) => void): Entity {
  const pos = getPortalPosition(kind)
  const root = engine.addEntity()
  Transform.create(root, { position: Vector3.create(pos.x, pos.y, pos.z) })
  const glow = kind === 'crew' ? sun : moon

  cylinder(root, { x: -1.05, y: 1.5, z: 0 }, { x: 0.16, y: 1.5, z: 0.16 }, midnight, { metallic: 0.45 })
  cylinder(root, { x: 1.05, y: 1.5, z: 0 }, { x: 0.16, y: 1.5, z: 0.16 }, midnight, { metallic: 0.45 })
  box(root, { x: 0, y: 3.05, z: 0 }, { x: 2.4, y: 0.18, z: 0.18 }, glow, {
    emissive: glow,
    emissiveIntensity: 1.6,
  })
  sphere(root, { x: 0, y: 1.55, z: 0 }, { x: 0.85, y: 1.15, z: 0.22 }, glow, {
    emissive: glow,
    emissiveIntensity: 1.8,
    transparencyMode: 1,
  })

  const pad = box(root, { x: 0, y: 0.08, z: 0 }, { x: 2.2, y: 0.16, z: 1.6 }, gold, {
    emissive: gold,
    emissiveIntensity: 0.6,
    collider: true,
  })

  const label = engine.addEntity()
  Transform.create(label, {
    parent: root,
    position: Vector3.create(0, 3.45, 0),
  })
  TextShape.create(label, {
    text: kind === 'crew' ? 'CREW GATE' : 'MOBILE LINK',
    fontSize: 1.15,
    textColor: cloud,
  })
  Billboard.create(label)

  setupInteraction(
    pad,
    () => onPortal(kind),
    kind === 'crew' ? 'Crew world gate' : 'Open mobile companion',
    POINTER_MAX_DISTANCE,
  )
  return root
}
