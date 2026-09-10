export type Team = 'sun' | 'moon'
export type Presence = 'online' | 'away' | 'offline'

export interface WorldFeed {
  version: number
  generatedAt: number
  origin: 'demo'
  players: Array<{
    id: string
    displayName: string
    team: Team
    score: number
    streak: number
    presence: Presence
    position: { x: number; y: number; z: number }
  }>
  rooms: Array<{ id: string; code: string; playerCount: number; capacity: number; phase: 'lobby' | 'active' | 'finished' }>
  missions: Array<{ id: string; title: string; progress: number; target: number }>
  events: Array<{ id: string; title: string; kind: 'tournament' | 'crew' | 'social' | 'governance'; startsAt: number }>
}
