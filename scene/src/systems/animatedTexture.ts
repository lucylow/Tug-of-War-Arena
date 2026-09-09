import { createUvAnimation, emissiveScrollProxy, stepUvAnimation, type UvAnimation } from '../materials'
import { gold, mint, withAlpha } from '../palette'
import { setEmissiveMaterial } from '../entities/primitives'
import type { Entity } from '@dcl/sdk/ecs'

type TrackedStrip = {
  entity: Entity
  animation: UvAnimation
}

const strips: TrackedStrip[] = []

export function startUVAnimation(entity: Entity, speed: number = 0.1): void {
  strips.push({
    entity,
    animation: createUvAnimation(speed, speed * 0.5),
  })
}

export function updateUVAnimations(dt: number, time: number): void {
  const intensity = emissiveScrollProxy(time)
  for (const strip of strips) {
    strip.animation = stepUvAnimation(strip.animation, dt)
    setEmissiveMaterial(strip.entity, withAlpha(mint, 0.9), intensity, {
      emissive: gold,
      roughness: 1,
      metallic: 0,
    })
  }
}

export function resetUVAnimations(): void {
  strips.length = 0
}
