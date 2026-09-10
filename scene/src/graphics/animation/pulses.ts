import { Transform, engine, type Entity } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

import { graphicPulseScale } from '../../logic/graphicsMotion'
import type { Vec3 } from '../../logic/mapping'

export interface PulseRef {
  entity: Entity
  baseScale: Vec3
  speed: number
  amount: number
  phase: number
}

const pulses: PulseRef[] = []
let initialized = false

export function addPulse(entity: Entity, baseScale: Vec3, speed = 2, amount = 0.08, phase = 0): void {
  pulses.push({ entity, baseScale, speed, amount, phase })
}

export function initPulseSystem(): void {
  if (initialized) return
  initialized = true
  engine.addSystem(() => {
    const time = Date.now() / 1000
    for (const item of pulses) {
      const next = graphicPulseScale(item.baseScale, time, item.speed, item.amount, item.phase)
      const transform = Transform.getMutable(item.entity)
      transform.scale = Vector3.create(next.x, next.y, next.z)
    }
  })
}
