import type { CrewId, WeatherKind } from '../logic/mapping'
import { shouldAcceptPull, shouldAcceptRematch, toWorldPhase } from '../logic/round'
import type { ArenaVisualInput, ArenaVisualState } from '../logic/snapshot'
import { applyVisualSnapshot, createDemoSnapshot, demoSinePull, stepDemoSnapshot } from '../logic/snapshot'
import type { WorldBridgeEvent } from '../logic/worldBridge'
import { resetCombo } from '../vfx/comboState'

export type SceneSession = {
  state: ArenaVisualState
  elapsed: number
  pendingTaps: number
  lastWinnerCelebrated: boolean
  manualControl: boolean
  playerCrew: CrewId | null
  playerName: string
}

export const session: SceneSession = {
  state: createDemoSnapshot(),
  elapsed: 0,
  pendingTaps: 0,
  lastWinnerCelebrated: false,
  manualControl: false,
  playerCrew: null,
  playerName: 'Visitor',
}

export function queueTap(count: number = 1) {
  if (!shouldAcceptPull(toWorldPhase(session.state.phase))) return
  session.pendingTaps += Math.max(0, count)
  session.manualControl = true
}

export function applyWorldBridgeEvent(event: WorldBridgeEvent) {
  if (event.type === 'pull') {
    queueTap(event.amount)
    return
  }
  if (event.type === 'join') {
    session.playerCrew = event.crew
    session.playerName = event.name ?? 'Visitor'
    return
  }
  if (event.type === 'rematch') {
    if (shouldAcceptRematch(toWorldPhase(session.state.phase))) restartMatch()
  }
}

export function applyRemoteState(input: ArenaVisualInput) {
  session.state = applyVisualSnapshot(session.state, input)
}

export function cycleWeather(): WeatherKind {
  const order: WeatherKind[] = ['sparkle', 'rain', 'snow', 'fog', 'clear']
  const index = order.indexOf(session.state.weather)
  const next = order[(index + 1) % order.length] ?? 'sparkle'
  session.state = { ...session.state, weather: next }
  return next
}

export function restartMatch() {
  const score = session.state.score
  session.state = createDemoSnapshot({ score, weather: session.state.weather, phase: 'lobby' })
  session.elapsed = 0
  session.pendingTaps = 0
  session.lastWinnerCelebrated = false
  session.manualControl = false
  resetCombo()
}

export function tickSession(dt: number, useSine: boolean) {
  session.elapsed += dt
  const taps = session.pendingTaps
  session.pendingTaps = 0
  const worldPhase = toWorldPhase(session.state.phase)
  if (useSine && !session.manualControl && taps === 0 && worldPhase === 'lobby') {
    session.state = {
      ...session.state,
      pull: demoSinePull(session.elapsed, 6),
    }
    return session.state
  }
  if (useSine && !session.manualControl && session.state.phase === 'live' && taps === 0) {
    session.state = {
      ...session.state,
      pull: demoSinePull(session.elapsed),
      timeRemaining: Math.max(0, session.state.timeRemaining - dt),
      sunPower: 40 + Math.sin(session.elapsed) * 20,
      moonPower: 40 + Math.cos(session.elapsed) * 20,
    }
    return session.state
  }
  session.state = stepDemoSnapshot(session.state, dt, taps)
  return session.state
}
