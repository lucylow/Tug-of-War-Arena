import {
  Entity,
  ParticleSystem,
  ParticleSystemBlendMode,
  Transform,
  engine,
} from '@dcl/sdk/ecs'
import { Color4, Quaternion, Vector3 } from '@dcl/sdk/math'

import { gold, sun } from '../palette'
import { QualityManager } from '../performance/QualityManager'
import { registerQualityParticle } from '../systems/quality'

function particleCap(fallback: number): number {
  const cap = QualityManager.getInstance().getSettings().particleCount
  if (cap <= 0) return 0
  return Math.min(fallback, cap)
}

/**
 * GPU fire. SDK7 ParticleSystem is one draw instead of dozens of sphere
 * entities (the naive CPU approach blows the mobile entity budget).
 */
export function createFire(position: Vector3, count: number = 24): Entity {
  const entity = engine.addEntity()
  Transform.create(entity, {
    position,
    rotation: Quaternion.fromEulerDegrees(-90, 0, 0),
  })
  ParticleSystem.create(entity, {
    shape: ParticleSystem.Shape.Cone({ angle: 16, radius: 0.1 }),
    rate: Math.max(6, count * 0.45),
    maxParticles: particleCap(count),
    lifetime: 0.85,
    gravity: -0.55,
    initialVelocitySpeed: { start: 0.5, end: 1.5 },
    initialSize: { start: 0.07, end: 0.14 },
    sizeOverTime: { start: 1, end: 0.15 },
    initialColor: { start: sun, end: gold },
    colorOverTime: {
      start: Color4.create(1, 0.55, 0.15, 0.95),
      end: Color4.create(0.2, 0.02, 0, 0),
    },
    blendMode: ParticleSystemBlendMode.PSB_ADD,
    loop: true,
    billboard: true,
  })
  registerQualityParticle(entity)
  return entity
}

export function createFireTrail(position: Vector3): Entity {
  const entity = engine.addEntity()
  Transform.create(entity, { position })
  ParticleSystem.create(entity, {
    shape: ParticleSystem.Shape.Point(),
    rate: 10,
    maxParticles: particleCap(20),
    lifetime: 0.55,
    gravity: 0.05,
    initialVelocitySpeed: { start: 0.1, end: 0.35 },
    initialSize: { start: 0.05, end: 0.1 },
    sizeOverTime: { start: 1, end: 0.1 },
    initialColor: { start: gold, end: sun },
    colorOverTime: {
      start: Color4.create(1, 0.85, 0.4, 0.8),
      end: Color4.create(1, 0.4, 0.1, 0),
    },
    blendMode: ParticleSystemBlendMode.PSB_ADD,
    billboard: true,
  })
  registerQualityParticle(entity)
  return entity
}

export function updateFireTrail(entity: Entity, position: Vector3): void {
  if (!Transform.has(entity)) return
  Transform.getMutable(entity).position = position
}

/** GPU particles advance internally; kept so the original update loop compiles. */
export function updateFire(_dt: number): void {
  return
}
