import { addFloat, initFloatSystem } from '../animation/float'
import { getHeroEmblemSpecs } from '../../logic/graphicsLayout'
import { createBox, createSphere } from '../primitives'

export function buildHeroEmblem(): void {
  initFloatSystem()
  const spec = getHeroEmblemSpecs()
  const base = createBox(spec.base.position, spec.base.scale, spec.base.tone, { emissive: true })
  addFloat(base, spec.base.position, spec.base.amplitude ?? 0.25, spec.base.speed ?? 0.75, spec.base.phase ?? 0)
  const ballA = createSphere(spec.sun.position, spec.sun.scale, spec.sun.tone, true)
  const ballB = createSphere(spec.moon.position, spec.moon.scale, spec.moon.tone, true)
  addFloat(ballA, spec.sun.position, spec.sun.amplitude ?? 0.12, spec.sun.speed ?? 1.3, spec.sun.phase ?? 0.4)
  addFloat(ballB, spec.moon.position, spec.moon.amplitude ?? 0.12, spec.moon.speed ?? 1.3, spec.moon.phase ?? 1)
}
