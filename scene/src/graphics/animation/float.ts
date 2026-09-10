import { Transform, engine, type Entity } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

import { graphicFloatOffset } from '../../logic/graphicsMotion'
import type { Vec3 } from '../../logic/mapping'

interface FloatingRef {
  entity: Entity
  origin: Vec3
  amplitude: number
  speed: number
  phase: number
}

const floating: FloatingRef[] = []
let initialized = false

export function addFloat(entity: Entity, origin: Vec3, amplitude = 0.25, speed = 1, phase = 0): void {
  floating.push({ entity, origin, amplitude, speed, phase })
}

export function initFloatSystem(): void {
  if (initialized) return
  initialized = true
  engine.addSystem(() => {
    const time = Date.now() / 1000
    for (const item of floating) {
      const next = graphicFloatOffset(item.origin, time, item.amplitude, item.speed, item.phase)
      Transform.getMutable(item.entity).position = Vector3.create(next.x, next.y, next.z)
    }
  })
}
