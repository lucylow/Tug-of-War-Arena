import { Entity, Transform } from '@dcl/sdk/ecs'

import { COPY } from '../copy'
import { gold } from '../palette'
import { box } from '../entities/primitives'
import { worldLabel } from '../logic/labels'
import { setupInteraction } from '../systems/interaction'

export function createPullPad(onPull: () => void): { pad: Entity; hint: Entity } {
  const pad = box(undefined, { x: 16, y: 0.28, z: 19.4 }, { x: 3.6, y: 0.32, z: 2.4 }, 'highlight', {
    collider: true,
    intensity: 1.8,
  })
  box(undefined, { x: 16, y: 0.12, z: 19.4 }, { x: 3.9, y: 0.1, z: 2.7 }, 'arena')
  worldLabel({ x: 16, y: 1.15, z: 19.4 }, COPY.pull, gold, 1.4)
  const hint = worldLabel({ x: 16, y: 0.72, z: 19.4 }, 'Click to pull', gold, 0.7)
  setupInteraction(pad, onPull, COPY.pull)
  return { pad, hint }
}

export function animatePad(pad: Entity, active: boolean): void {
  const transform = Transform.getMutable(pad)
  transform.scale.y = active ? 0.22 : 0.32
}
