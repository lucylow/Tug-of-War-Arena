import { MeshCollider } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

import { box } from '../entities/primitives'
import { setupInteraction } from '../systems/interaction'
import { worldLabel } from '../ui/labels'
import { pull, rematch, type GameState } from './gameLoop'
import { updateRope, type RopeHandle } from './rope'

let pullCount = 0
let boundState: GameState | null = null
let boundRope: RopeHandle | null = null

export function bindArenaControls(state: GameState, rope: RopeHandle): void {
  boundState = state
  boundRope = rope
}

export function createPullPad(): void {
  const pad = box(undefined, { x: 16, y: 0.18, z: 12.4 }, { x: 2.4, y: 0.22, z: 2.4 }, 'highlight', { collider: true })
  MeshCollider.setBox(pad)
  worldLabel('PULL PAD', Vector3.create(16, 1.4, 12.4), 1.2)
  setupInteraction(pad, () => {
    if (boundState) {
      pull(boundState, boundState.sunScore >= boundState.moonScore ? 'sun' : 'moon')
      updateRope(boundState.localPower)
      return
    }
    pullCount += 1
    updateRope(pullCount)
  }, 'PULL')
}

export function createJoinPad(): void {
  const pad = box(undefined, { x: 12.2, y: 0.18, z: 12.4 }, { x: 2.0, y: 0.22, z: 2.0 }, 'sun', { collider: true })
  worldLabel('JOIN ROOM', Vector3.create(12.2, 1.3, 12.4), 0.95)
  setupInteraction(pad, () => {
    console.log('[world] join demo room 731XZ Friday Night Pull')
  }, 'JOIN FRIDAY NIGHT PULL')
}

export function createRematchPad(): void {
  const pad = box(undefined, { x: 16, y: 0.18, z: 20.2 }, { x: 2.2, y: 0.22, z: 2.2 }, 'neutral', { collider: true })
  worldLabel('REMATCH', Vector3.create(16, 1.3, 20.2), 1.05)
  setupInteraction(pad, () => {
    if (boundState && boundRope) {
      rematch(boundState, boundRope)
      return
    }
    pullCount = 0
    updateRope(0)
  }, 'REMATCH')
}
