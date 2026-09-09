import { Entity, LightSource, SkyboxTime, Transform, engine } from '@dcl/sdk/ecs'
import { Color3, Quaternion, Vector3 } from '@dcl/sdk/math'

import { SCENE } from '../config'
import { ARENA_CENTER } from '../logic/mapping'
import { lightingPolicy } from '../logic/mobileRuntime'
import { fill3, gold3, moon3, sun3 } from '../palette'
import { SceneErrorHandler } from './errorHandling'
import { registerQualityLight } from './quality'

export type LightingOptions = {
  mobile?: boolean
  enableLights?: boolean
  shadows?: boolean
}

/**
 * Night skybox time always. Dynamic `LightSource` is skipped on the mobile
 * explorer (unsupported until v1.13.0) so the plaza stays emissive-only.
 */
export function setupSkyboxTime(): void {
  try {
    if (!SkyboxTime.has(engine.RootEntity)) {
      SkyboxTime.create(engine.RootEntity, { fixedTime: SCENE.nightSeconds })
    } else {
      SkyboxTime.getMutable(engine.RootEntity).fixedTime = SCENE.nightSeconds
    }
  } catch (error) {
    SceneErrorHandler.getInstance().recordFault('Skybox time unavailable', error)
  }
}

export function setupLighting(options: LightingOptions = {}): Entity[] {
  setupSkyboxTime()
  const policy = lightingPolicy(options.mobile ?? true)
  const enableLights = options.enableLights ?? policy.dynamicLights
  const shadows = options.shadows ?? policy.shadows
  if (!enableLights) return []

  try {
    return createLights(shadows)
  } catch (error) {
    SceneErrorHandler.getInstance().recordFault('LightSource unavailable; using emissive-only lighting', error)
    return []
  }
}

function createLights(shadows: boolean): Entity[] {
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
    shadow: shadows,
    active: true,
  })
  registerQualityLight(key, shadows, 140000)

  const sunFill = pointLight(Vector3.create(ARENA_CENTER.x - 7.5, 3.4, ARENA_CENTER.z), sun3, 90000)
  const moonFill = pointLight(Vector3.create(ARENA_CENTER.x + 7.5, 3.4, ARENA_CENTER.z), moon3, 90000)
  const ambient = pointLight(Vector3.create(ARENA_CENTER.x, 5.5, ARENA_CENTER.z - 4), fill3, 50000)

  return [key, sunFill, moonFill, ambient]
}

function pointLight(position: Vector3, color: Color3, intensity: number): Entity {
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
