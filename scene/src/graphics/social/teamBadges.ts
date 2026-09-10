import { addPulse, initPulseSystem } from '../animation/pulses'
import { getTeamBadgeSpecs } from '../../logic/graphicsLayout'
import { createBox, createSphere } from '../primitives'

export function buildTeamBadges(): void {
  initPulseSystem()
  for (const team of getTeamBadgeSpecs()) {
    createBox(team.plate.position, team.plate.scale, team.plate.tone, { emissive: true })
    const orb = createSphere(team.orb.position, team.orb.scale, team.orb.tone, true)
    addPulse(orb, team.orb.scale, team.orb.speed ?? 1.8, team.orb.amount ?? 0.1, team.orb.phase ?? 0)
    createBox(team.bar.position, team.bar.scale, team.bar.tone, { emissive: true })
  }
}
