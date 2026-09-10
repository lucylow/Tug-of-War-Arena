export type Team = 'sun' | 'moon'
export type Presence = 'online' | 'away' | 'offline'
export type Origin = 'demo'

export interface Vec3 {
  x: number
  y: number
  z: number
}

export interface WorldPlayer {
  id: string
  displayName: string
  team: Team
  score: number
  streak: number
  presence: Presence
  worldPosition: Vec3
  origin: Origin
}

export interface WorldRoom {
  id: string
  code: string
  title: string
  playerCount: number
  capacity: number
  phase: 'lobby' | 'active' | 'finished'
  origin: Origin
}

export interface WorldMission {
  id: string
  title: string
  progress: number
  target: number
  origin: Origin
}

export interface WorldEvent {
  id: string
  title: string
  kind: 'tournament' | 'crew' | 'social' | 'governance'
  startsAt: number
  origin: Origin
}

export interface WorldMatch {
  id: string
  winner: Team
  highlight: string
  origin: Origin
}

export interface WorldActivity {
  id: string
  actor: string
  message: string
  origin: Origin
}

export interface MockWorldDataset {
  origin: Origin
  generatedAt: number
  players: WorldPlayer[]
  rooms: WorldRoom[]
  matches: WorldMatch[]
  missions: WorldMission[]
  events: WorldEvent[]
  activity: WorldActivity[]
  reactions: WorldActivity[]
  leaderboard: { sunScore: number; moonScore: number; timeLabel: string; roomTitle: string; roomCode: string }
}
