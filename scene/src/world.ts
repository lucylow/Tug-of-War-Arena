import { createCrewBases } from './entities/crewBase'
import { createCrewBoard } from './entities/crewBoard'
import { createEntrance } from './entities/entrance'
import { createMatchPads } from './entities/pads'
import { createPortals } from './entities/portals'
import { buildGovernanceExperience } from './governance/bootstrap'
import { bootstrapHybridWorld } from './hybrid'
import { setupAmbientMotion } from './systems/ambient'
import { SceneErrorHandler } from './systems/errorHandling'
import { emitWorldEvent } from './systems/messageBus'

/**
 * Spatial journey assembly: entrance → crew choice → match pads → governance plaza → social board → portals.
 * Gameplay rules stay in `logic/`; this file only places world entities.
 */
function place(label: string, run: () => void): void {
  try {
    run()
  } catch (error) {
    SceneErrorHandler.getInstance().recordFault(`${label} unavailable`, error)
  }
}

export function assembleWorld(): void {
  place('Entrance', () => createEntrance((crew) => emitWorldEvent({ type: 'join', crew, name: 'Visitor' })))
  place('Crew bases', () => createCrewBases())
  place('Match pads', () =>
    createMatchPads(
      () => emitWorldEvent({ type: 'pull', amount: 1 }),
      () => emitWorldEvent({ type: 'rematch' }),
    ),
  )
  place('Ambient motion', () => setupAmbientMotion())
  place('Governance plaza', () => buildGovernanceExperience())
  place('Crew board', () => createCrewBoard(() => emitWorldEvent({ type: 'reaction', emoji: '🔥', from: 'Plaza' })))
  place('Portals', () => {
    createPortals((kind) => {
      if (kind === 'crew') {
        emitWorldEvent({ type: 'reaction', emoji: '🚪', from: 'Crew gate' })
        return
      }
      emitWorldEvent({ type: 'reaction', emoji: '📱', from: 'Mobile link' })
    })
  })
  place('Hybrid demo universe', () => bootstrapHybridWorld())
}
