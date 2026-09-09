import type { ArenaVisualState } from '../logic/snapshot'
import { applyVisualSnapshot, createDemoSnapshot, demoSinePull, stepDemoSnapshot } from '../logic/snapshot'
import type { ArenaVisualInput } from '../logic/snapshot'
import type { WeatherKind } from '../logic/mapping'
import { resetCombo } from '../vfx/comboState'

export type SceneSession = {
  state: ArenaVisualState
  elapsed: number
  pendingTaps: number
  lastWinnerCelebrated: boolean
  manualControl: boolean
}

export const session: SceneSession = {
  state: createDemoSnapshot(),
  elapsed: 0,
  pendingTaps: 0,
  lastWinnerCelebrated: false,
  manualControl: false,
}

export function queueTap(count: number = 1) {
  session.pendingTaps += Math.max(0, count)
  session.manualControl = true
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
  session.state = createDemoSnapshot({ score, weather: session.state.weather })
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
