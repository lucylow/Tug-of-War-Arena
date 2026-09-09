import { Entity, MeshRenderer, Transform, engine } from '@dcl/sdk/ecs'
import { Color4, Quaternion, Vector3 } from '@dcl/sdk/math'

import { ARENA_CENTER } from '../logic/mapping'
import { gold, skyHorizon, skyNight, withAlpha } from '../palette'
import { pbrMaterial, plane, setEmissiveMaterial, sphere } from './primitives'

export type SkyboxHandle = {
  root: Entity
  walls: Entity[]
  sun: Entity
}

/**
 * Inward-facing sky planes. A giant sphere would be backface-culled from
 * inside the parcel, so we build a cube dome the camera can actually see.
 */
export function createSkybox(
  color: Color4 = skyNight,
  options: { walls?: boolean } = {},
): SkyboxHandle {
  const root = engine.addEntity()
  Transform.create(root, {
    position: Vector3.create(ARENA_CENTER.x, 0, ARENA_CENTER.z),
  })

  const walls: Entity[] =
    options.walls === false
      ? []
      : [
          plane(root, { x: 0, y: 12, z: 15.6 }, { x: 32, y: 24, z: 1 }, color, Quaternion.fromEulerDegrees(0, 180, 0)),
          plane(root, { x: 0, y: 12, z: -15.6 }, { x: 32, y: 24, z: 1 }, color, Quaternion.fromEulerDegrees(0, 0, 0)),
          plane(root, { x: 15.6, y: 12, z: 0 }, { x: 32, y: 24, z: 1 }, skyHorizon, Quaternion.fromEulerDegrees(0, -90, 0)),
          plane(root, { x: -15.6, y: 12, z: 0 }, { x: 32, y: 24, z: 1 }, skyHorizon, Quaternion.fromEulerDegrees(0, 90, 0)),
          plane(root, { x: 0, y: 22, z: 0 }, { x: 32, y: 32, z: 1 }, withAlpha(skyNight, 1), Quaternion.fromEulerDegrees(-90, 0, 0)),
        ]

  const sun = createSunGlow(Vector3.create(ARENA_CENTER.x + 10, 16, ARENA_CENTER.z + 8))
  return { root, walls, sun }
}

export function createSunGlow(position: Vector3): Entity {
  const sun = engine.addEntity()
  Transform.create(sun, {
    position,
    scale: Vector3.create(2.4, 2.4, 2.4),
  })
  MeshRenderer.setSphere(sun)
  pbrMaterial(sun, Color4.create(1, 0.92, 0.62, 1), {
    emissive: gold,
    emissiveIntensity: 2.2,
    roughness: 1,
    metallic: 0,
    meshKey: 'sphere',
  })

  const halo = sphere(sun, { x: 0, y: 0, z: 0 }, { x: 1.65, y: 1.65, z: 1.65 }, withAlpha(gold, 0.18), {
    emissive: gold,
    emissiveIntensity: 1.1,
    roughness: 1,
    metallic: 0,
  })
  void halo
  return sun
}

export function pulseSunGlow(sun: Entity, time: number): void {
  setEmissiveMaterial(sun, Color4.create(1, 0.92, 0.62, 1), 1.6 + Math.sin(time * 0.6) * 0.5, {
    emissive: gold,
    roughness: 1,
    metallic: 0,
  })
}
