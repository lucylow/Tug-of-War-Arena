import {
  MATCH_DURATION_SECONDS,
  PULL_MAX,
  clamp,
  clampPull,
  normalizeTeam,
  winningCrew,
  type CrewId,
  type TeamAlias,
  type WeatherKind,
} from './mapping'

export type ArenaPlayer = {
  id: string
  team: CrewId
  index: number
  lastClip: 'idle' | 'tap' | 'swipe' | 'celebrate' | 'defeat'
}

export type ArenaVisualState = {
  phase: 'idle' | 'countdown' | 'live' | 'results'
  pull: number
  sunPower: number
  moonPower: number
  timeRemaining: number
  score: [number, number]
  weather: WeatherKind
  weatherIntensity: number
  winner: CrewId | null
  celebrating: boolean
  players: ArenaPlayer[]
}

export type ArenaVisualInput = {
  pull?: number
  sunPower?: number
  moonPower?: number
  timeRemaining?: number
  score?: [number, number]
  weather?: WeatherKind
  weatherIntensity?: number
  players?: Array<{ id: string; team: TeamAlias; index?: number }>
  phase?: ArenaVisualState['phase']
}

export function createDemoSnapshot(overrides: ArenaVisualInput = {}): ArenaVisualState {
  const players = (overrides.players ?? [
    { id: 'sun-1', team: 'sun' as const, index: 0 },
    { id: 'sun-2', team: 'sun' as const, index: 1 },
    { id: 'moon-1', team: 'moon' as const, index: 0 },
    { id: 'moon-2', team: 'moon' as const, index: 1 },
  ]).map((player, index) => ({
    id: player.id,
    team: normalizeTeam(player.team),
    index: player.index ?? index,
    lastClip: 'idle' as const,
  }))

  return {
    phase: overrides.phase ?? 'live',
    pull: clampPull(overrides.pull ?? 0),
    sunPower: clamp(overrides.sunPower ?? 12, 0, 100),
    moonPower: clamp(overrides.moonPower ?? 12, 0, 100),
    timeRemaining: overrides.timeRemaining ?? MATCH_DURATION_SECONDS,
    score: overrides.score ?? [0, 0],
    weather: overrides.weather ?? 'sparkle',
    weatherIntensity: clamp(overrides.weatherIntensity ?? 0.55, 0, 1),
    winner: winningCrew(overrides.pull ?? 0),
    celebrating: false,
    players,
  }
}

export function applyVisualSnapshot(
  current: ArenaVisualState,
  incoming: ArenaVisualInput,
): ArenaVisualState {
  const pull = incoming.pull === undefined ? current.pull : clampPull(incoming.pull)
  const winner = winningCrew(pull)
  return {
    ...current,
    phase: incoming.phase ?? current.phase,
    pull,
    sunPower: incoming.sunPower === undefined ? current.sunPower : clamp(incoming.sunPower, 0, 100),
    moonPower: incoming.moonPower === undefined ? current.moonPower : clamp(incoming.moonPower, 0, 100),
    timeRemaining: incoming.timeRemaining ?? current.timeRemaining,
    score: incoming.score ?? current.score,
    weather: incoming.weather ?? current.weather,
    weatherIntensity: incoming.weatherIntensity === undefined
      ? current.weatherIntensity
      : clamp(incoming.weatherIntensity, 0, 1),
    winner,
    celebrating: current.celebrating || winner !== null,
    players: incoming.players
      ? incoming.players.map((player, index) => ({
          id: player.id,
          team: normalizeTeam(player.team),
          index: player.index ?? index,
          lastClip: 'idle',
        }))
      : current.players,
  }
}

/**
 * Local demo clock used when no Colyseus room is connected.
 * Mirrors the mobile loop: player taps add pull, opponent pressure leaks it back.
 */
export function stepDemoSnapshot(
  state: ArenaVisualState,
  dt: number,
  tapsThisFrame: number = 0,
): ArenaVisualState {
  if (state.phase !== 'live') return state

  const tapForce = tapsThisFrame * 1.35
  const opponentPressure = state.pull > 0 ? 0.65 * dt * 8 : 0.9 * dt * 8
  const nextPull = clampPull(state.pull + tapForce - opponentPressure)
  const nextTime = Math.max(0, state.timeRemaining - dt)
  const winner = winningCrew(nextPull) ?? (nextTime <= 0 ? (nextPull >= 0 ? 'sun' : 'moon') : null)
  const finished = winner !== null || nextTime <= 0

  return {
    ...state,
    pull: nextPull,
    sunPower: clamp(state.sunPower + tapsThisFrame * 4 - dt * 6, 0, 100),
    moonPower: clamp(state.moonPower + dt * 8 - tapsThisFrame * 1.5, 0, 100),
    timeRemaining: finished ? 0 : nextTime,
    phase: finished ? 'results' : 'live',
    winner: finished ? winner ?? (nextPull >= 0 ? 'sun' : 'moon') : null,
    celebrating: finished,
    score: finished
      ? [
          state.score[0] + (winner === 'sun' || (winner === null && nextPull >= 0) ? 1 : 0),
          state.score[1] + (winner === 'moon' ? 1 : 0),
        ]
      : state.score,
  }
}

export function demoSinePull(time: number, amplitude: number = 18): number {
  return clamp(Math.sin(time * 0.45) * amplitude, -PULL_MAX, PULL_MAX)
}
