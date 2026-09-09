import type { ArenaVisualInput } from './snapshot'

export type RemoteArenaPacket = {
  pull: number
  sunPower: number
  moonPower: number
  timeRemaining: number
  score: [number, number]
  weather?: 'clear' | 'sparkle' | 'rain' | 'snow' | 'fog'
  phase?: ArenaVisualInput['phase']
}

export type SyncedMatchSlice = {
  ropePosition: number
  teamPower: readonly number[]
  matchTime: number
  scores: readonly (number | string)[]
  matchStatus: string
}

export function visualInputFromPacket(packet: RemoteArenaPacket): ArenaVisualInput {
  return {
    pull: packet.pull,
    sunPower: packet.sunPower,
    moonPower: packet.moonPower,
    timeRemaining: packet.timeRemaining,
    score: packet.score,
    weather: packet.weather,
    phase: packet.phase,
  }
}

export function packetFromSyncedMatch(state: SyncedMatchSlice): RemoteArenaPacket {
  const phase: ArenaVisualInput['phase'] =
    state.matchStatus === 'playing'
      ? 'live'
      : state.matchStatus === 'ended'
        ? 'results'
        : state.matchStatus === 'waiting'
          ? 'idle'
          : 'countdown'

  return {
    pull: state.ropePosition,
    sunPower: Number(state.teamPower[0] ?? 0),
    moonPower: Number(state.teamPower[1] ?? 0),
    timeRemaining: state.matchTime,
    score: [Number(state.scores[0] ?? 0), Number(state.scores[1] ?? 0)],
    phase,
  }
}
