import { engine } from '@dcl/sdk/ecs'

import { createArenaStage, createRope, resetRope } from './arena/rope'
import { createPullPad, createRematchPad } from './arena/pads'
import { createCrewBases, createPortals, createSpawnPlaza } from './arena/plaza'
import { createAchievementTerminal } from './blockchain/terminal'
import { createDebugControls } from './debug'
import { createGovernancePlaza } from './governance/plaza'
import { DEFAULT_GRAPHICS } from './config'
import { createAtmosphere } from './sky/atmosphere'
import { createPlayerMarkers, createSocialBoards } from './social/boards'
import { resolveGraphics } from './systems/graphics'
import { fadeTemporary, removeExpiredEntities } from './systems/temporaryEntities'
import { schedule, startWorldScheduler } from './systems/worldScheduler'
import { createWorldTutorial } from './tutorial'

export function assembleWorld(): void {
  createSpawnPlaza()
  createCrewBases()
  createArenaStage()
  createRope()
  createPullPad()
  createRematchPad()
  createPlayerMarkers()
  createSocialBoards()
  createGovernancePlaza()
  createAchievementTerminal()
  createPortals()
  createWorldTutorial(true)
  const graphics = resolveGraphics(DEFAULT_GRAPHICS, false)
  createAtmosphere(graphics.ambient)
  createDebugControls(() => resetRope())
  startWorldScheduler((fn) => {
    engine.addSystem(fn)
  })
  schedule('temporary', 250, () => {
    removeExpiredEntities()
    fadeTemporary()
  })
}
