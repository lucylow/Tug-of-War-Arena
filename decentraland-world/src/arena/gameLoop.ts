import type { Entity } from '@dcl/sdk/ecs'

import { TARGET_UPDATE_MS } from '../config'
import { startPerformanceSystem } from '../systems/performance'
import { setLabelText } from '../ui/labels'
import { updateRope, type RopeHandle } from './rope'

export type MatchPhase = 'waiting' | 'countdown' | 'playing' | 'finished'

export interface GameState {
  phase: MatchPhase
  sunScore: number
  moonScore: number
  seconds: number
  localPower: number
  dirty: boolean
}

export function createGameState(): GameState {
  return {
    phase: 'playing',
    sunScore: 428,
    moonScore: 381,
    seconds: 42,
    localPower: 0,
    dirty: true,
  }
}

function formatClock(seconds: number): string {
  const mm = Math.max(0, Math.floor(seconds / 60))
  const ss = Math.max(0, seconds % 60)
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

function paintHud(scoreLabel: Entity, timerLabel: Entity, state: GameState): void {
  try {
    setLabelText(scoreLabel, `SUN ${state.sunScore}   MOON ${state.moonScore}`)
    setLabelText(timerLabel, `${state.phase.toUpperCase()}  ${formatClock(state.seconds)}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown'
    console.error(`[world] hud update failed: ${message}`)
  }
  state.dirty = false
}

export function startGameLoop(rope: RopeHandle, scoreLabel: Entity, timerLabel: Entity, state: GameState): void {
  void rope
  let elapsedMs = 0
  paintHud(scoreLabel, timerLabel, state)
  startPerformanceSystem(() => {
    elapsedMs += TARGET_UPDATE_MS
    if (elapsedMs < 1000 && !state.dirty) return
    if (elapsedMs >= 1000) {
      elapsedMs = 0
      if (state.phase === 'countdown') {
        state.seconds -= 1
        if (state.seconds <= 0) {
          state.phase = 'playing'
          state.seconds = 42
        }
        state.dirty = true
      } else if (state.phase === 'playing') {
        state.seconds -= 1
        const drift = (state.sunScore - state.moonScore) / 40
        updateRope(Math.max(-4, Math.min(4, drift + state.localPower)))
        if (state.seconds <= 0) {
          state.phase = 'finished'
          updateRope(0.15)
        }
        state.dirty = true
      }
    }
    if (state.dirty) paintHud(scoreLabel, timerLabel, state)
  })
}

export function pull(state: GameState, team: 'sun' | 'moon'): void {
  if (state.phase !== 'playing') return
  state.localPower += 1
  if (team === 'sun') state.sunScore += 1
  else state.moonScore += 1
  state.dirty = true
}

export function rematch(state: GameState, rope: RopeHandle): void {
  state.phase = 'countdown'
  state.seconds = 3
  state.localPower = 0
  state.dirty = true
  void rope
  updateRope(0)
}
