import { Transform, engine } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

import { ENABLE_DEMO_SINE_ROPE } from '../config'
import { avatarsByTeam, playAvatarAnimation, updateAvatars } from '../entities/avatar'
import { updateHud3D, type Hud3D } from '../entities/hud3d'
import { updateRopePosition, type RopeHandle } from '../entities/rope'
import { updateWinZones } from '../entities/winZones'
import { ARENA_CENTER } from '../logic/mapping'
import { tickPerformance } from '../performance'
import { tickWorldReactions } from '../social/reactions'
import {
  emitSpark,
  pulseRopeGlow,
  registerComboTap,
  showCombo,
  tickVfx,
  triggerCelebration,
  triggerPowerSurge,
} from '../vfx'
import { tickAdvancedVisuals, triggerPowerSurgeFx } from '../visuals'
import { playPullSound } from './audio'
import { SceneErrorHandler } from './errorHandling'
import { celebrateWinner } from './fireworks'
import { tickMaterialSystems } from './overdraw'
import { session, tickSession } from './session'
import { setWeather } from './weather'

let hud: Hud3D | null = null
let rope: RopeHandle | null = null
let lastWeather = session.state.weather
let lastPowerBurst = 0

export function bindVisualSystems(nextHud: Hud3D | null, nextRope: RopeHandle) {
  hud = nextHud
  rope = nextRope
}

export function mainLoop(dt: number) {
  tickPerformance(dt)
  tickMaterialSystems(dt)
  const taps = session.pendingTaps
  if (taps > 0) {
    playPullSound()
    const sunAvatars = avatarsByTeam('sun')
    if (sunAvatars[0]) playAvatarAnimation(sunAvatars[0], 'tap', false)
    const combo = registerComboTap(session.elapsed)
    if (combo >= 3) showCombo(combo)
    maybePowerSurge('sun', session.state.sunPower)
    maybePowerSurge('moon', session.state.moonPower)
  }

  const state = tickSession(dt, ENABLE_DEMO_SINE_ROPE)

  if (rope) updateRopePosition(rope.root, state.pull, session.elapsed)
  updateWinZones(session.elapsed)
  updateAvatars(dt, session.elapsed)

  const knot = rope && Transform.has(rope.knot) ? Transform.get(rope.knot).position : undefined
  const knotVec = knot ? Vector3.create(knot.x, knot.y, knot.z) : Vector3.create(ARENA_CENTER.x, 1.55, ARENA_CENTER.z)
  if (taps > 0 || Math.abs(state.pull) > 28) {
    emitSpark(knotVec)
  }
  pulseRopeGlow(knotVec, state.pull)
  tickVfx(dt, state.weather, state.weatherIntensity)
  tickWorldReactions(dt)
  tickAdvancedVisuals(dt, session.elapsed, knot, { sun: state.sunPower, moon: state.moonPower })

  if (hud) {
    updateHud3D(hud, {
      timeRemaining: state.timeRemaining,
      sunScore: state.score[0],
      moonScore: state.score[1],
      sunPower: state.sunPower,
      moonPower: state.moonPower,
      phase: state.phase,
      winner: state.winner,
    })
  }

  if (state.weather !== lastWeather) {
    setWeather(state.weather, state.weatherIntensity)
    lastWeather = state.weather
  }

  if (state.celebrating && state.winner && !session.lastWinnerCelebrated) {
    celebrateWinner(state.winner)
    triggerCelebration(Vector3.create(ARENA_CENTER.x, 4.4, ARENA_CENTER.z))
    const winners = avatarsByTeam(state.winner)
    const losers = avatarsByTeam(state.winner === 'sun' ? 'moon' : 'sun')
    for (const avatar of winners) playAvatarAnimation(avatar, 'celebrate', true)
    for (const avatar of losers) playAvatarAnimation(avatar, 'defeat', false)
    session.lastWinnerCelebrated = true
  }
}

export function registerMainLoop() {
  let lastFaultAt = 0
  engine.addSystem(function guardedMainLoop(dt: number) {
    try {
      mainLoop(dt)
    } catch (error) {
      const now = Date.now()
      if (now - lastFaultAt < 2000) return
      lastFaultAt = now
      SceneErrorHandler.getInstance().recordFault('Main loop frame failed', error)
    }
  })
}

function maybePowerSurge(team: 'sun' | 'moon', power: number) {
  if (power > 70 && session.elapsed - lastPowerBurst > 1.2) {
    const x = team === 'sun' ? ARENA_CENTER.x - 4 : ARENA_CENTER.x + 4
    triggerPowerSurge(Vector3.create(x, 1.6, ARENA_CENTER.z), team)
    triggerPowerSurgeFx(team)
    lastPowerBurst = session.elapsed
  }
}
