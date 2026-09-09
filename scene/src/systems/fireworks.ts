import { Entity, ParticleSystem, Transform, engine } from '@dcl/sdk/ecs'
import { Color4, Vector3 } from '@dcl/sdk/math'

import { ARENA_CENTER } from '../logic/mapping'
import { ParticleBlend } from '../logic/particleEnums'
import { gold, mint, moon, sun } from '../palette'
import { QualityManager } from '../performance/QualityManager'
import { SceneErrorHandler } from './errorHandling'
import { registerQualityParticle } from './quality'

const fireworks: Entity[] = []

function particleCap(fallback: number): number {
  const cap = QualityManager.getInstance().getSettings().particleCount
  if (cap <= 0) return 0
  return Math.min(fallback, cap)
}

export function createFirework(center: Vector3 = Vector3.create(ARENA_CENTER.x, 4.2, ARENA_CENTER.z)): Entity {
  const entity = engine.addEntity()
  Transform.create(entity, { position: center })
  const cap = particleCap(80)
  if (cap <= 0) return entity
  try {
    ParticleSystem.create(entity, {
      shape: ParticleSystem.Shape.Point(),
      rate: 0,
      maxParticles: cap,
      lifetime: 1.6,
      gravity: 0.55,
      initialVelocitySpeed: { start: 3, end: 7 },
      initialSize: { start: 0.08, end: 0.16 },
      sizeOverTime: { start: 1, end: 0.15 },
      initialColor: { start: sun, end: gold },
      colorOverTime: { start: Color4.create(1, 0.9, 0.4, 1), end: Color4.create(0.2, 0.4, 1, 0) },
      blendMode: ParticleBlend.ADD,
      loop: true,
      bursts: {
        values: [
          { time: 0, count: 70, cycles: 0, interval: 2.4, probability: 1 },
          { time: 0.55, count: 50, cycles: 0, interval: 2.4, probability: 1 },
        ],
      },
    })
    fireworks.push(entity)
    registerQualityParticle(entity)
  } catch (error) {
    SceneErrorHandler.getInstance().recordFault('Fireworks unavailable', error)
  }
  return entity
}

export function celebrateWinner(team: 'sun' | 'moon') {
  const color = team === 'sun' ? sun : moon
  const entity = engine.addEntity()
  Transform.create(entity, {
    position: Vector3.create(ARENA_CENTER.x, 5.2, ARENA_CENTER.z),
  })
  const cap = particleCap(90)
  if (cap <= 0) return
  try {
    ParticleSystem.create(entity, {
      shape: ParticleSystem.Shape.Sphere({ radius: 0.3 }),
      rate: 0,
      maxParticles: cap,
      lifetime: 2.2,
      gravity: 0.2,
      initialVelocitySpeed: { start: 2.5, end: 6 },
      initialSize: { start: 0.1, end: 0.2 },
      initialColor: { start: color, end: mint },
      colorOverTime: { start: Color4.create(color.r, color.g, color.b, 1), end: Color4.create(1, 1, 1, 0) },
      blendMode: ParticleBlend.ADD,
      loop: false,
      bursts: {
        values: [{ time: 0, count: 80, cycles: 1, interval: 0, probability: 1 }],
      },
    })
    fireworks.push(entity)
    registerQualityParticle(entity)
  } catch (error) {
    SceneErrorHandler.getInstance().recordFault('Winner celebration particles unavailable', error)
  }
}
