import { Entity, LightSource, SkyboxTime, Transform, engine } from '@dcl/sdk/ecs'
import { Quaternion, Vector3 } from '@dcl/sdk/math'

import { SCENE } from '../config'
import { ARENA_CENTER } from '../logic/mapping'
import { fill3, gold3, moon3, sun3 } from '../palette'
import { registerQualityLight } from './quality'

/**
 * Four lights for a 2×2 parcel scene (SDK cap: one light per parcel).
 * Directional sun is the skybox; local mood comes from spots/points.
 */
export function setupLighting(): Entity[] {
  if (!SkyboxTime.has(engine.RootEntity)) {
    SkyboxTime.create(engine.RootEntity, { fixedTime: SCENE.nightSeconds })
  } else {
    SkyboxTime.getMutable(engine.RootEntity).fixedTime = SCENE.nightSeconds
  }

  const key = engine.addEntity()
  Transform.create(key, {
    position: Vector3.create(ARENA_CENTER.x, 8.4, ARENA_CENTER.z),
    rotation: Quaternion.fromEulerDegrees(-90, 0, 0),
  })
  LightSource.create(key, {
    type: LightSource.Type.Spot({ innerAngle: 28, outerAngle: 58 }),
    color: gold3,
    intensity: 140000,
    range: 22,
    shadow: true,
    active: true,
  })
  registerQualityLight(key, true, 140000)

  const sunFill = pointLight(
    Vector3.create(ARENA_CENTER.x - 7.5, 3.4, ARENA_CENTER.z),
    sun3,
    90000,
  )
  const moonFill = pointLight(
    Vector3.create(ARENA_CENTER.x + 7.5, 3.4, ARENA_CENTER.z),
    moon3,
    90000,
  )
  const ambient = pointLight(
    Vector3.create(ARENA_CENTER.x, 5.5, ARENA_CENTER.z - 4),
    fill3,
    50000,
  )

  return [key, sunFill, moonFill, ambient]
}

function pointLight(position: Vector3, color: ReturnType<typeof sun3>, intensity: number): Entity {
  const entity = engine.addEntity()
  Transform.create(entity, { position })
  LightSource.create(entity, {
    type: LightSource.Type.Point({}),
    color,
    intensity,
    range: 14,
    active: true,
  })
  registerQualityLight(entity, false, intensity)
  return entity
}
