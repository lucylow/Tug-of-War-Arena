import { Entity, Schemas, Transform, engine } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

import { ambientOffset, applyAmbientOrigin } from '../logic/ambient'
import { getAmbientCloudOrigin, getAmbientSparkleOrigin } from '../logic/journey'
import { cloud, gold } from '../palette'
import { sphere } from '../entities/primitives'

export const AmbientMotion = engine.defineComponent('tow-ambient-motion', {
  kind: Schemas.String,
  speedRadius: Schemas.Number,
  phase: Schemas.Number,
  originX: Schemas.Number,
  originY: Schemas.Number,
  originZ: Schemas.Number,
})

const CLOUD_COUNT = 4
const SPARKLE_COUNT = 8

let ambientTime = 0
let started = false

export function setupAmbientMotion(): Entity[] {
  const entities: Entity[] = []
  for (let i = 0; i < CLOUD_COUNT; i += 1) {
    entities.push(spawnAmbient('cloud', getAmbientCloudOrigin(i), { x: 1.6, y: 0.45, z: 1.1 }, cloud, 1.8, i * 0.9))
  }
  for (let i = 0; i < SPARKLE_COUNT; i += 1) {
    entities.push(spawnAmbient('sparkle', getAmbientSparkleOrigin(i), { x: 0.12, y: 0.12, z: 0.12 }, gold, 0.55, i * 0.7))
  }
  ensureAmbientSystem()
  return entities
}

/** Attach the existing ambient float system to an extra plaza accent. */
export function addAmbientMotion(
  entity: Entity,
  _amplitude: number,
  radius: number,
  phase: number,
  originY?: number,
): void {
  const transform = Transform.get(entity)
  AmbientMotion.create(entity, {
    kind: 'sparkle',
    speedRadius: radius,
    phase,
    originX: transform.position.x,
    originY: originY ?? transform.position.y,
    originZ: transform.position.z,
  })
  ensureAmbientSystem()
}

function ensureAmbientSystem(): void {
  if (started) return
  engine.addSystem(ambientSystem)
  started = true
}

function spawnAmbient(
  kind: 'cloud' | 'sparkle',
  origin: { x: number; y: number; z: number },
  scale: { x: number; y: number; z: number },
  color: typeof cloud,
  radius: number,
  phase: number,
): Entity {
  const extras =
    kind === 'sparkle'
      ? { emissive: gold, emissiveIntensity: 2.2 }
      : { emissive: cloud, emissiveIntensity: 0.25 }
  const entity = sphere(undefined, origin, scale, color, extras)
  AmbientMotion.create(entity, {
    kind,
    speedRadius: radius,
    phase,
    originX: origin.x,
    originY: origin.y,
    originZ: origin.z,
  })
  return entity
}

function ambientSystem(dt: number) {
  ambientTime += dt
  for (const [entity, motion] of engine.getEntitiesWith(AmbientMotion, Transform)) {
    const kind = motion.kind === 'cloud' ? 'cloud' : 'sparkle'
    const offset = ambientOffset(kind, ambientTime, motion.phase, motion.speedRadius)
    const next = applyAmbientOrigin(
      { x: motion.originX, y: motion.originY, z: motion.originZ },
      offset,
    )
    Transform.getMutable(entity).position = Vector3.create(next.x, next.y, next.z)
  }
}
