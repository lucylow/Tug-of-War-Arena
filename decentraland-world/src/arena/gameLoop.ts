import { startPerformanceSystem } from '../systems/performance'
import { setLabelText } from '../ui/labels'
import type { Entity } from '@dcl/sdk/ecs'
import { updateRope, type RopeHandle } from './rope'

export type MatchPhase = 'waiting' | 'countdown' | 'playing' | 'finished'

export interface GameState {
  phase: MatchPhase
  sunScore: number
  moonScore: number
  seconds: number
  localPower: number
}

export function createGameState(): GameState {
  return {
    phase: 'playing',
    sunScore: 428,
    moonScore: 381,
    seconds: 42,
    localPower: 0,
  }
}

export function startGameLoop(rope: RopeHandle, scoreLabel: Entity, timerLabel: Entity, state: GameState): void {
  startPerformanceSystem(() => {
    if (state.phase === 'countdown') {
      state.seconds -= 1
      if (state.seconds <= 0) {
        state.phase = 'playing'
        state.seconds = 42
      }
    } else if (state.phase === 'playing') {
      state.seconds -= 1
      const drift = (state.sunScore - state.moonScore) / 40
      void rope
      updateRope(Math.max(-4, Math.min(4, drift + state.localPower)))
      if (state.seconds <= 0) {
        state.phase = 'finished'
        updateRope(0.15)
      }
    }
    const mm = Math.max(0, Math.floor(state.seconds / 60))
    const ss = Math.max(0, state.seconds % 60)
    setLabelText(scoreLabel, `SUN ${state.sunScore}   MOON ${state.moonScore}`)
    setLabelText(timerLabel, `${state.phase.toUpperCase()}  ${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`)
  })
}

export function pull(state: GameState, team: 'sun' | 'moon'): void {
  if (state.phase !== 'playing') return
  state.localPower += 1
  if (team === 'sun') state.sunScore += 1
  else state.moonScore += 1
}

export function rematch(state: GameState, rope: RopeHandle): void {
  state.phase = 'countdown'
  state.seconds = 3
  state.localPower = 0
  void rope
  updateRope(0)
}
