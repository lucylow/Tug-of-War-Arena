import { engine } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

import { createArena } from './arena/createArena'
import { createGameState, startGameLoop, type GameState } from './arena/gameLoop'
import { bindArenaControls, createJoinPad, createPullPad, createRematchPad } from './arena/pads'
import { createCrewBases, createSpawnPlaza } from './arena/plaza'
import { createArenaStage, createRope, resetRope, type RopeHandle } from './arena/rope'
import { createAchievementTerminal } from './blockchain/terminal'
import { createWorldBlockchainState } from './blockchain/worldState'
import { DEFAULT_GRAPHICS } from './config'
import { createDebugControls } from './debug'
import { createGovernancePlaza } from './governance/plaza'
import { createMockWorldDataset, type MockWorldDataset } from './mock3d'
import { spawnPlayerAvatars } from './players/playerAvatar'
import { createPortals } from './portals'
import { createAtmosphere } from './sky/atmosphere'
import { createSocialBoards } from './social/boards'
import { resolveGraphics } from './systems/graphics'
import { runWorldStep, runWorldValue } from './systems/safe'
import { fadeTemporary, removeExpiredEntities } from './systems/temporaryEntities'
import { schedule, startWorldScheduler } from './systems/worldScheduler'
import { createWorldTutorial } from './tutorial'
import { worldLabel } from './ui/labels'

function fallbackGameState(): GameState {
  const state = createGameState()
  state.sunScore = 428
  state.moonScore = 381
  return state
}

export function assembleWorld(): void {
  const dataset = runWorldValue<MockWorldDataset | null>('mock-dataset', () => createMockWorldDataset(), () => null)
  const chain = runWorldValue('blockchain-state', () => createWorldBlockchainState(), () => createWorldBlockchainState())
  const state = runWorldValue(
    'game-state',
    () => {
      const next = createGameState()
      if (dataset) {
        next.sunScore = dataset.leaderboard.sunScore
        next.moonScore = dataset.leaderboard.moonScore
      }
      return next
    },
    () => fallbackGameState(),
  )

  runWorldStep('spawn-plaza', () => createSpawnPlaza())
  runWorldStep('crew-bases', () => createCrewBases())
  runWorldStep('arena', () => createArena())
  runWorldStep('arena-stage', () => createArenaStage())

  const rope = runWorldValue<RopeHandle | null>('rope', () => createRope(), () => null)
  if (rope) {
    runWorldStep('bind-controls', () => bindArenaControls(state, rope))
  }

  runWorldStep('pull-pad', () => createPullPad())
  runWorldStep('join-pad', () => createJoinPad())
  runWorldStep('rematch-pad', () => createRematchPad())
  runWorldStep('player-avatars', () => {
    if (dataset) spawnPlayerAvatars(dataset.players)
  })
  runWorldStep('social-boards', () => createSocialBoards())
  runWorldStep('governance', () => createGovernancePlaza())
  runWorldStep('achievement-terminal', () => createAchievementTerminal())
  runWorldStep('portals', () => {
    createPortals((id) => {
      console.log('[world] portal', id)
    })
  })
  runWorldStep('tutorial', () => createWorldTutorial(true))

  const sun = dataset?.leaderboard.sunScore ?? state.sunScore
  const moon = dataset?.leaderboard.moonScore ?? state.moonScore
  const timeLabel = dataset?.leaderboard.timeLabel ?? '00:42'
  const scoreLabel = runWorldValue(
    'score-label',
    () => worldLabel(`SUN ${sun}   MOON ${moon}`, Vector3.create(16, 2.6, 21.6), 1.05),
    () => engine.addEntity(),
  )
  const timerLabel = runWorldValue(
    'timer-label',
    () => worldLabel(`PLAYING  ${timeLabel}`, Vector3.create(16, 2.15, 21.6), 0.95),
    () => engine.addEntity(),
  )
  runWorldStep('wallet-label', () => {
    worldLabel(
      chain.demoMode ? 'BLOCKCHAIN OPTIONAL  DEMO MODE' : 'WALLET CONNECTED',
      Vector3.create(27.4, 3.1, 24.4),
      0.65,
    )
  })

  if (rope) {
    runWorldStep('game-loop', () => startGameLoop(rope, scoreLabel, timerLabel, state))
  }

  runWorldStep('atmosphere', () => {
    const graphics = resolveGraphics(DEFAULT_GRAPHICS, false)
    createAtmosphere(graphics.ambient)
  })
  runWorldStep('debug-controls', () => createDebugControls(() => resetRope()))
  runWorldStep('scheduler', () => {
    startWorldScheduler((fn) => {
      engine.addSystem(fn)
    })
    schedule('temporary', 250, () => {
      removeExpiredEntities()
      fadeTemporary()
    })
  })
}
