import {
  Entity,
  ParticleSystem,
  ParticleSystemBlendMode,
  ParticleSystemPlaybackState,
  Transform,
  engine,
} from '@dcl/sdk/ecs'
import { Color4, Vector3 } from '@dcl/sdk/math'

import { ARENA_CENTER, weatherParticleBudget, type WeatherKind } from '../logic/mapping'
import { cloud, fog, moon } from '../palette'

let weatherRoot: Entity | null = null
let current: WeatherKind = 'sparkle'

export function setWeather(kind: WeatherKind, intensity: number = 1): Entity | null {
  if (weatherRoot) {
    engine.removeEntity(weatherRoot)
    weatherRoot = null
  }
  current = kind
  if (kind === 'clear' || kind === 'sparkle') return null

  const budget = weatherParticleBudget(kind, intensity)
  const entity = engine.addEntity()
  weatherRoot = entity
  Transform.create(entity, {
    position: Vector3.create(ARENA_CENTER.x, kind === 'fog' ? 2.2 : 8.5, ARENA_CENTER.z),
  })

  if (kind === 'rain') {
    ParticleSystem.create(entity, {
      shape: ParticleSystem.Shape.Box({ size: Vector3.create(24, 2, 18) }),
      rate: Math.max(8, budget),
      maxParticles: budget,
      lifetime: 1.4,
      gravity: 2.4,
      additionalForce: Vector3.create(0.4, 0, 0),
      initialSize: { start: 0.03, end: 0.05 },
      initialColor: { start: Color4.create(0.7, 0.82, 1, 0.55), end: moon },
      colorOverTime: { start: Color4.create(0.7, 0.82, 1, 0.5), end: Color4.create(0.7, 0.82, 1, 0) },
      faceTravelDirection: true,
      billboard: false,
    })
  } else if (kind === 'snow') {
    ParticleSystem.create(entity, {
      shape: ParticleSystem.Shape.Box({ size: Vector3.create(24, 2, 18) }),
      rate: Math.max(6, budget * 0.7),
      maxParticles: budget,
      lifetime: 5,
      gravity: 0.18,
      additionalForce: Vector3.create(0.15, 0, 0.05),
      initialSize: { start: 0.05, end: 0.1 },
      initialColor: { start: cloud, end: fog },
      colorOverTime: { start: Color4.create(1, 1, 1, 0.85), end: Color4.create(1, 1, 1, 0) },
    })
  } else {
    ParticleSystem.create(entity, {
      shape: ParticleSystem.Shape.Box({ size: Vector3.create(22, 4, 16) }),
      rate: Math.max(4, budget * 0.5),
      maxParticles: budget,
      lifetime: 6,
      gravity: 0,
      initialVelocitySpeed: { start: 0.05, end: 0.2 },
      initialSize: { start: 0.8, end: 1.6 },
      sizeOverTime: { start: 0.6, end: 1.2 },
      initialColor: { start: Color4.create(0.5, 0.55, 0.7, 0.08), end: fog },
      colorOverTime: { start: Color4.create(0.5, 0.55, 0.7, 0.1), end: Color4.create(0.5, 0.55, 0.7, 0) },
      blendMode: ParticleSystemBlendMode.PSB_ALPHA,
    })
  }

  return entity
}

export function startRain(intensity: number = 1) {
  return setWeather('rain', intensity)
}

export function createFog(intensity: number = 1) {
  return setWeather('fog', intensity)
}

/** ParticleSystem advances rain internally; kept for the original scene API. */
export function updateRain(_dt: number) {
  return current
}

export function currentWeather() {
  return current
}

export function stopWeather() {
  if (weatherRoot && ParticleSystem.has(weatherRoot)) {
    ParticleSystem.getMutable(weatherRoot).playbackState = ParticleSystemPlaybackState.PS_STOPPED
  }
}
