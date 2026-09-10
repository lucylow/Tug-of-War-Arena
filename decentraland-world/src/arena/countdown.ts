import { Transform, type Entity } from '@dcl/sdk/ecs'

import { gold } from '../palette'
import { worldLabel, setLabel } from '../logic/labels'

const STEPS = ['READY', '3', '2', '1', 'PULL!'] as const

export function createCountdown(): Entity {
  const entity = worldLabel({ x: 16, y: 3.8, z: 16 }, '', gold, 2.2)
  return entity
}

export function playCountdown(label: Entity, step: number, reducedMotion: boolean): void {
  const text = STEPS[step] ?? ''
  setLabel(label, text)
  if (reducedMotion || !Transform.has(label)) return
  Transform.getMutable(label).scale.y = step === 4 ? 1.2 : 1
}

export function hideCountdown(label: Entity): void {
  setLabel(label, '')
}
