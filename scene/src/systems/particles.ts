import {
  Entity,
  ParticleSystem,
  ParticleSystemBlendMode,
  ParticleSystemPlaybackState,
  Transform,
  engine,
} from '@dcl/sdk/ecs'
import { Color4, Quaternion, Vector3 } from '@dcl/sdk/math'

import { ARENA_CENTER } from '../logic/mapping'
import { gold, moon, sun } from '../palette'
import { registerQualityParticle } from './quality'

const emitters: Entity[] = []

export function setupAmbientParticles(): Entity[] {
  const sunTorch = fire(Vector3.create(ARENA_CENTER.x - 12.6, 2.9, ARENA_CENTER.z - 9.2), sun)
  const moonTorch = fire(Vector3.create(ARENA_CENTER.x + 12.6, 2.9, ARENA_CENTER.z + 9.2), moon)

  emitters.push(sunTorch, moonTorch)
  return emitters
}

function fire(position: Vector3, color: Color4): Entity {
  return emitter({
    position,
    rotation: Quaternion.fromEulerDegrees(-90, 0, 0),
    shape: ParticleSystem.Shape.Cone({ angle: 18, radius: 0.12 }),
    rate: 14,
    maxParticles: 28,
    lifetime: 0.9,
    gravity: -0.6,
    initialVelocitySpeed: { start: 0.6, end: 1.6 },
    initialSize: { start: 0.08, end: 0.16 },
    sizeOverTime: { start: 1, end: 0.2 },
    initialColor: { start: color, end: gold },
    colorOverTime: { start: Color4.create(color.r, color.g, color.b, 0.9), end: Color4.create(0.1, 0, 0, 0) },
    blendMode: ParticleSystemBlendMode.PSB_ADD,
  })
}

export function burstPowerSurge(team: 'sun' | 'moon') {
  const x = team === 'sun' ? ARENA_CENTER.x - 4 : ARENA_CENTER.x + 4
  const burst = emitter({
    position: Vector3.create(x, 1.6, ARENA_CENTER.z),
    shape: ParticleSystem.Shape.Sphere({ radius: 0.4 }),
    rate: 0,
    maxParticles: 40,
    lifetime: 0.8,
    gravity: -0.2,
    initialVelocitySpeed: { start: 2, end: 5 },
    initialSize: { start: 0.08, end: 0.14 },
    initialColor: { start: team === 'sun' ? sun : moon, end: gold },
    colorOverTime: { start: Color4.create(1, 1, 1, 0.9), end: Color4.create(1, 1, 1, 0) },
    blendMode: ParticleSystemBlendMode.PSB_ADD,
    loop: false,
    bursts: {
      values: [{ time: 0, count: 36, cycles: 1, interval: 0, probability: 1 }],
    },
  })
  emitters.push(burst)
}

type EmitterConfig = {
  position: Vector3
  rotation?: ReturnType<typeof Quaternion.fromEulerDegrees>
  shape: ReturnType<typeof ParticleSystem.Shape.Point> | ReturnType<typeof ParticleSystem.Shape.Box> | ReturnType<typeof ParticleSystem.Shape.Cone> | ReturnType<typeof ParticleSystem.Shape.Sphere>
  rate: number
  maxParticles: number
  lifetime: number
  gravity?: number
  initialVelocitySpeed?: { start: number; end: number }
  initialSize?: { start: number; end: number }
  sizeOverTime?: { start: number; end: number }
  initialColor?: { start: Color4; end: Color4 }
  colorOverTime?: { start: Color4; end: Color4 }
  blendMode?: ParticleSystemBlendMode
  loop?: boolean
  bursts?: { values: Array<{ time: number; count: number; cycles: number; interval: number; probability: number }> }
}

function emitter(config: EmitterConfig): Entity {
  const entity = engine.addEntity()
  Transform.create(entity, {
    position: config.position,
    rotation: config.rotation ?? Quaternion.fromEulerDegrees(0, 0, 0),
  })
  ParticleSystem.create(entity, {
    shape: config.shape,
    rate: config.rate,
    maxParticles: config.maxParticles,
    lifetime: config.lifetime,
    gravity: config.gravity ?? 0,
    initialVelocitySpeed: config.initialVelocitySpeed,
    initialSize: config.initialSize,
    sizeOverTime: config.sizeOverTime,
    initialColor: config.initialColor,
    colorOverTime: config.colorOverTime,
    blendMode: config.blendMode ?? ParticleSystemBlendMode.PSB_ALPHA,
    loop: config.loop ?? true,
    bursts: config.bursts,
    billboard: true,
  })
  registerQualityParticle(entity)
  return entity
}

export function stopEmitter(entity: Entity) {
  if (ParticleSystem.has(entity)) {
    ParticleSystem.getMutable(entity).playbackState = ParticleSystemPlaybackState.PS_STOPPED
  }
}
