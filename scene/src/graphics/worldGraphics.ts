import { GRAPHICS_BUILD_ORDER } from '../logic/graphicsLayout'
import { buildArenaCenterpiece } from './arena/centerpiece'
import { buildArenaPillars } from './arena/pillars'
import { buildArenaRails } from './arena/rails'
import { buildArenaStage } from './arena/stage'
import { buildConfettiField } from './scene/confetti'
import { buildDecorativeTiles } from './scene/decorativeTiles'
import { buildHeroEmblem } from './scene/heroEmblem'
import { buildPortalFrames } from './scene/portalFrames'
import { buildGraphicSignage } from './scene/signage'
import { buildSkyBackdrop } from './scene/skyDome'
import { buildStarField } from './scene/stars'
import { buildTeamBadges } from './social/teamBadges'

let built = false

const BUILDERS: Record<(typeof GRAPHICS_BUILD_ORDER)[number], () => void> = {
  sky: buildSkyBackdrop,
  stars: buildStarField,
  stage: buildArenaStage,
  pillars: buildArenaPillars,
  centerpiece: buildArenaCenterpiece,
  signage: buildGraphicSignage,
  badges: buildTeamBadges,
  portals: buildPortalFrames,
  emblem: buildHeroEmblem,
  rails: buildArenaRails,
  confetti: buildConfettiField,
  tiles: buildDecorativeTiles,
}

function composeFamily(label: (typeof GRAPHICS_BUILD_ORDER)[number], run: () => void): void {
  try {
    run()
  } catch (error) {
    console.log(`[graphics] ${label} unavailable`, error)
  }
}

export function buildAdvancedWorldGraphics(): void {
  if (built) return
  built = true

  for (const family of GRAPHICS_BUILD_ORDER) {
    composeFamily(family, BUILDERS[family])
  }
}
