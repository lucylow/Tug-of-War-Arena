import { addPulse, initPulseSystem } from '../animation/pulses'
import { getStarSpecs } from '../../logic/graphicsLayout'
import { createSphere } from '../primitives'

export function buildStarField(): void {
  initPulseSystem()
  for (const star of getStarSpecs()) {
    const entity = createSphere(star.position, star.scale, star.tone, true)
    addPulse(entity, star.scale, star.speed ?? 1.7, star.amount ?? 0.45, star.phase ?? 0)
  }
}
