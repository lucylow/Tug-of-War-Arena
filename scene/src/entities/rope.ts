import { Entity, GltfContainer, MeshRenderer, Transform, engine } from '@dcl/sdk/ecs'
import { Quaternion, Vector3 } from '@dcl/sdk/math'

import { MODELS, SCENE, USE_GLB_ASSETS } from '../config'
import {
  ARENA_CENTER,
  mapPullToStretch,
  mapPullToTiltDegrees,
  ropeControlPoints,
  segmentTransform,
} from '../logic/mapping'
import { cloud, gold } from '../palette'
import { pbrMaterial } from './primitives'

export type RopeHandle = {
  root: Entity
  segments: Entity[]
  knot: Entity
}

let rope: RopeHandle | null = null

export function createRope(): RopeHandle {
  const root = engine.addEntity()
  Transform.create(root, {
    position: Vector3.create(ARENA_CENTER.x, 0, ARENA_CENTER.z),
  })

  if (USE_GLB_ASSETS) {
    GltfContainer.create(root, { src: MODELS.rope })
  }

  const segments: Entity[] = []
  if (!USE_GLB_ASSETS) {
    for (let i = 0; i < SCENE.ropeSegments; i += 1) {
      const segment = engine.addEntity()
      Transform.create(segment, {
        position: Vector3.create(ARENA_CENTER.x, 1.5, ARENA_CENTER.z),
      })
      MeshRenderer.setCylinder(segment)
      pbrMaterial(segment, cloud, {
        metallic: 0.18,
        roughness: 0.38,
        emissive: gold,
        emissiveIntensity: 0.4,
        meshKey: 'cylinder',
      })
      segments.push(segment)
    }
  }

  const knot = engine.addEntity()
  Transform.create(knot, {
    position: Vector3.create(ARENA_CENTER.x, 1.55, ARENA_CENTER.z),
    scale: Vector3.create(0.36, 0.36, 0.36),
  })
  MeshRenderer.setBox(knot)
  pbrMaterial(knot, gold, {
    metallic: 0.55,
    roughness: 0.22,
    emissive: gold,
    emissiveIntensity: 2.4,
    meshKey: 'box',
  })

  rope = { root, segments, knot }
  updateRopePosition(root, 0, 0)
  return rope
}

export function getRope(): RopeHandle | null {
  return rope
}

export function getRopeKnotPosition(): Vector3 {
  if (!rope) return Vector3.create(ARENA_CENTER.x, 1.55, ARENA_CENTER.z)
  const transform = Transform.get(rope.knot)
  return Vector3.create(transform.position.x, transform.position.y, transform.position.z)
}

/**
 * Drive the rope from game state. `position` is the mobile pull value (-44..44).
 */
export function updateRopePosition(ropeEntity: Entity, position: number, time: number = 0): void {
  const handle = rope
  if (!handle || handle.root !== ropeEntity || handle.segments.length === 0) {
    const transform = Transform.getMutable(ropeEntity)
    transform.rotation = Quaternion.fromEulerDegrees(0, 0, mapPullToTiltDegrees(position))
    const stretch = mapPullToStretch(position)
    transform.scale = Vector3.create(stretch, 1, 1)
    return
  }

  const points = ropeControlPoints(position, handle.segments.length, time)
  for (let i = 0; i < handle.segments.length; i += 1) {
    const from = points[i]
    const to = points[i + 1]
    const segment = handle.segments[i]
    if (!from || !to || !segment) continue
    const laid = segmentTransform(from, to)
    const transform = Transform.getMutable(segment)
    transform.position = Vector3.create(laid.position.x, laid.position.y, laid.position.z)
    transform.scale = Vector3.create(0.2, laid.length, 0.2)
    const pitch = 90 - (laid.pitch * 180) / Math.PI
    const yaw = (laid.yaw * 180) / Math.PI
    transform.rotation = Quaternion.fromEulerDegrees(pitch, yaw, 0)
  }

  const mid = points[Math.floor(points.length / 2)]
  if (mid) {
    const knotTransform = Transform.getMutable(handle.knot)
    knotTransform.position = Vector3.create(mid.x, mid.y, mid.z)
  }
}
