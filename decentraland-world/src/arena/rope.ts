import { Transform, engine } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

import { ARENA_CENTER, ROPE_SEGMENTS } from '../config'
import { box, cylinder, sphere } from '../entities/primitives'
import { worldLabel } from '../ui/labels'

export type RopeHandle = {
  root: ReturnType<typeof engine.addEntity>
  segments: ReturnType<typeof engine.addEntity>[]
  knot: ReturnType<typeof engine.addEntity>
}

let rope: RopeHandle | null = null

export function createRope(): RopeHandle {
  const root = engine.addEntity()
  Transform.create(root, { position: Vector3.create(ARENA_CENTER.x, 0, ARENA_CENTER.z) })
  const segments = []
  for (let i = 0; i < ROPE_SEGMENTS; i += 1) {
    const t = i / (ROPE_SEGMENTS - 1)
    const x = 6 + t * 20
    segments.push(cylinder(undefined, { x, y: 1.45, z: ARENA_CENTER.z }, { x: 0.18, y: 0.18, z: 0.18 }, 'rope'))
  }
  const knot = sphere(undefined, { x: ARENA_CENTER.x, y: 1.55, z: ARENA_CENTER.z }, { x: 0.32, y: 0.32, z: 0.32 }, 'highlight')
  rope = { root, segments, knot }
  worldLabel('ROPE', Vector3.create(ARENA_CENTER.x, 2.4, ARENA_CENTER.z - 2.2), 1.1)
  return rope
}

export function updateRope(pull = 0): void {
  if (!rope) return
  const offset = Math.max(-4, Math.min(4, pull * 0.08))
  for (let i = 0; i < rope.segments.length; i += 1) {
    const transform = Transform.getMutable(rope.segments[i])
    const t = i / Math.max(1, rope.segments.length - 1)
    transform.position = Vector3.create(6 + t * 20 + offset * (t - 0.5), 1.45, ARENA_CENTER.z)
  }
  Transform.getMutable(rope.knot).position = Vector3.create(ARENA_CENTER.x + offset, 1.55, ARENA_CENTER.z)
}

export function resetRope(): void {
  updateRope(0)
}

export function createArenaStage(): void {
  box(undefined, { x: ARENA_CENTER.x, y: 0.08, z: ARENA_CENTER.z }, { x: 18, y: 0.16, z: 8 }, 'arena', { collider: true })
  box(undefined, { x: 7, y: 0.6, z: ARENA_CENTER.z }, { x: 0.35, y: 1.2, z: 8 }, 'sun', { collider: true })
  box(undefined, { x: 25, y: 0.6, z: ARENA_CENTER.z }, { x: 0.35, y: 1.2, z: 8 }, 'moon', { collider: true })
  worldLabel('CENTRAL ARENA', Vector3.create(ARENA_CENTER.x, 3.2, ARENA_CENTER.z + 4.4), 1.4)
  worldLabel('SCORE WALL  SUN 428   MOON 381', Vector3.create(ARENA_CENTER.x, 2.6, ARENA_CENTER.z + 5.6), 1.05)
  worldLabel('MATCH TIMER  00:42', Vector3.create(ARENA_CENTER.x, 2.15, ARENA_CENTER.z + 5.6), 0.95)
}
