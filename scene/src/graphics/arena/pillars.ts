import { addPulse, initPulseSystem } from '../animation/pulses'
import { getPillarSpecs } from '../../logic/graphicsLayout'
import { createBox, createSphere } from '../primitives'

export function buildArenaPillars(): void {
  initPulseSystem()
  for (const pillar of getPillarSpecs()) {
    createBox(pillar.column.position, pillar.column.scale, pillar.column.tone, { emissive: true })
    const orb = createSphere(pillar.orb.position, pillar.orb.scale, pillar.orb.tone, true)
    addPulse(orb, pillar.orb.scale, pillar.orb.speed ?? 1.5, pillar.orb.amount ?? 0.14, pillar.orb.phase ?? 0)
    createBox(pillar.plinth.position, pillar.plinth.scale, pillar.plinth.tone, { emissive: true })
  }
}
