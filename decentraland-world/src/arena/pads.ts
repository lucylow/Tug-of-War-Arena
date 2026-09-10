import { MeshCollider } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

import { box } from '../entities/primitives'
import { setupInteraction } from '../systems/interaction'
import { worldLabel } from '../ui/labels'
import { updateRope } from './rope'

let pullCount = 0

export function createPullPad(): void {
  const pad = box(undefined, { x: 16, y: 0.18, z: 12.4 }, { x: 2.4, y: 0.22, z: 2.4 }, 'highlight', { collider: true })
  MeshCollider.setBox(pad)
  worldLabel('PULL PAD', Vector3.create(16, 1.4, 12.4), 1.2)
  setupInteraction(pad, () => {
    pullCount += 1
    updateRope(pullCount)
  }, 'PULL')
}

export function createRematchPad(): void {
  const pad = box(undefined, { x: 16, y: 0.18, z: 20.2 }, { x: 2.2, y: 0.22, z: 2.2 }, 'neutral', { collider: true })
  worldLabel('REMATCH', Vector3.create(16, 1.3, 20.2), 1.05)
  setupInteraction(pad, () => {
    pullCount = 0
    updateRope(0)
  }, 'REMATCH')
}
