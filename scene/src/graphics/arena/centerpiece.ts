import { addFloat, initFloatSystem } from '../animation/float'
import { addPulse, initPulseSystem } from '../animation/pulses'
import { getCenterpieceOrb, getCenterpieceRaySpecs } from '../../logic/graphicsLayout'
import { createBox, createSphere } from '../primitives'

export function buildArenaCenterpiece(): void {
  initFloatSystem()
  initPulseSystem()
  const spec = getCenterpieceOrb()
  const orb = createSphere(spec.position, spec.scale, spec.tone, true)
  addFloat(orb, spec.position, spec.amplitude ?? 0.18, spec.speed ?? 1.4, spec.phase ?? 0.2)
  addPulse(orb, spec.scale, 2.3, spec.amount ?? 0.12, 0.5)

  for (const ray of getCenterpieceRaySpecs()) {
    const entity = createBox(ray.position, ray.scale, ray.tone, { emissive: true })
    addFloat(entity, ray.position, ray.amplitude ?? 0.1, ray.speed ?? 1.1, ray.phase ?? 0)
  }
}
