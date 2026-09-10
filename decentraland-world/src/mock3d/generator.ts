import { WORLD_SEED } from './seed'
import type { MockWorldDataset, WorldActivity, WorldEvent, WorldMatch, WorldMission, WorldPlayer, WorldRoom } from './types'

const NAMES: Array<Pick<WorldPlayer, 'displayName' | 'team' | 'presence' | 'score' | 'streak' | 'worldPosition'>> = [
  { displayName: 'NovaWisp', team: 'sun', presence: 'online', score: 1084, streak: 4, worldPosition: { x: 4.6, y: 0.85, z: 16 } },
  { displayName: 'PixelRally', team: 'moon', presence: 'online', score: 88, streak: 3, worldPosition: { x: 27.4, y: 0.85, z: 16 } },
  { displayName: 'MoonRunner', team: 'moon', presence: 'online', score: 74, streak: 2, worldPosition: { x: 18.2, y: 0.85, z: 12.4 } },
  { displayName: 'SunSpark', team: 'sun', presence: 'online', score: 81, streak: 5, worldPosition: { x: 12.4, y: 0.85, z: 22.6 } },
  { displayName: 'RopeWizard', team: 'sun', presence: 'online', score: 90, streak: 6, worldPosition: { x: 6.2, y: 0.85, z: 14.2 } },
  { displayName: 'ArenaFox', team: 'sun', presence: 'online', score: 67, streak: 1, worldPosition: { x: 8.4, y: 0.85, z: 18.1 } },
  { displayName: 'TorqueKid', team: 'moon', presence: 'online', score: 71, streak: 2, worldPosition: { x: 24.2, y: 0.85, z: 14.8 } },
  { displayName: 'CloudPull', team: 'sun', presence: 'away', score: 58, streak: 0, worldPosition: { x: 10.1, y: 0.85, z: 10.6 } },
  { displayName: 'NeonTug', team: 'moon', presence: 'online', score: 63, streak: 3, worldPosition: { x: 22.8, y: 0.85, z: 20.4 } },
  { displayName: 'OrbitAce', team: 'moon', presence: 'online', score: 77, streak: 4, worldPosition: { x: 16.8, y: 0.85, z: 9.6 } },
  { displayName: 'FluxFighter', team: 'sun', presence: 'away', score: 54, streak: 1, worldPosition: { x: 5.4, y: 0.85, z: 21.2 } },
  { displayName: 'StarGrip', team: 'moon', presence: 'offline', score: 49, streak: 0, worldPosition: { x: 26.6, y: 0.85, z: 22.1 } },
  { displayName: 'EmberPull', team: 'sun', presence: 'online', score: 42, streak: 1, worldPosition: { x: 7.1, y: 0.85, z: 11.8 } },
  { displayName: 'HaloLine', team: 'moon', presence: 'away', score: 39, streak: 0, worldPosition: { x: 25.4, y: 0.85, z: 11.2 } },
  { displayName: 'QuarkTug', team: 'sun', presence: 'offline', score: 33, streak: 0, worldPosition: { x: 11.6, y: 0.85, z: 24.4 } },
  { displayName: 'NimbusBay', team: 'moon', presence: 'online', score: 46, streak: 2, worldPosition: { x: 20.2, y: 0.85, z: 24.1 } },
  { displayName: 'VoltCrew', team: 'sun', presence: 'online', score: 51, streak: 2, worldPosition: { x: 14.2, y: 0.85, z: 8.4 } },
  { displayName: 'ShadeHop', team: 'moon', presence: 'offline', score: 28, streak: 0, worldPosition: { x: 19.4, y: 0.85, z: 8.2 } },
]

export function createPlayers(): WorldPlayer[] {
  return NAMES.map((player, index) => ({ ...player, id: `player_${index}`, origin: 'demo' }))
}

export function createRooms(): WorldRoom[] {
  return [
    { id: 'room_friday', code: '731XZ', title: 'Friday Night Pull', playerCount: 8, capacity: 8, phase: 'active', origin: 'demo' },
    { id: 'room_rival', code: '284KT', title: 'Sun vs Moon', playerCount: 4, capacity: 8, phase: 'lobby', origin: 'demo' },
    { id: 'room_rooftop', code: '819QP', title: 'Rooftop Arena', playerCount: 6, capacity: 8, phase: 'lobby', origin: 'demo' },
    { id: 'room_dawn', code: '441LM', title: 'Dawn Relay', playerCount: 3, capacity: 8, phase: 'finished', origin: 'demo' },
    { id: 'room_night', code: '902VW', title: 'Night Watch Pull', playerCount: 5, capacity: 8, phase: 'active', origin: 'demo' },
  ]
}

export function createMatches(): WorldMatch[] {
  return Array.from({ length: 24 }, (_, index) => ({
    id: `match_${index}`,
    winner: index % 2 === 0 ? 'sun' : 'moon',
    highlight: index % 2 === 0 ? 'Sun Crew held the line' : 'Moon Crew stole the finish',
    origin: 'demo',
  }))
}

export function createMissions(): WorldMission[] {
  return [
    { id: 'mission_pulls', title: 'Pull Together', progress: 84, target: 100, origin: 'demo' },
    { id: 'mission_invite', title: 'Bring the Crew', progress: 2, target: 3, origin: 'demo' },
    { id: 'mission_streak', title: 'Keep the Fire', progress: 3, target: 5, origin: 'demo' },
    { id: 'mission_plaza', title: 'Visit Governance Plaza', progress: 0, target: 1, origin: 'demo' },
    { id: 'mission_react', title: 'Cheer a Teammate', progress: 8, target: 8, origin: 'demo' },
  ]
}

export function createEvents(): WorldEvent[] {
  return [
    { id: 'event_cup', title: 'Sun vs Moon Cup', kind: 'tournament', startsAt: WORLD_SEED, origin: 'demo' },
    { id: 'event_friday', title: 'Friendzone Friday', kind: 'social', startsAt: WORLD_SEED + 1, origin: 'demo' },
    { id: 'event_clash', title: 'Crew Clash', kind: 'crew', startsAt: WORLD_SEED + 2, origin: 'demo' },
    { id: 'event_briefing', title: 'Plaza Briefing', kind: 'governance', startsAt: WORLD_SEED + 3, origin: 'demo' },
    { id: 'event_relay', title: 'Quest Relay', kind: 'crew', startsAt: WORLD_SEED + 4, origin: 'demo' },
    { id: 'event_after', title: 'Afterglow Social', kind: 'social', startsAt: WORLD_SEED + 5, origin: 'demo' },
    { id: 'event_draft', title: 'Wearable Draft', kind: 'governance', startsAt: WORLD_SEED + 6, origin: 'demo' },
    { id: 'event_open', title: 'Open Arena Night', kind: 'tournament', startsAt: WORLD_SEED + 7, origin: 'demo' },
  ]
}

export function createActivity(players: WorldPlayer[]): WorldActivity[] {
  return Array.from({ length: 24 }, (_, index) => ({
    id: `activity_${index}`,
    actor: players[index % players.length]?.displayName ?? 'NovaWisp',
    message: index % 3 === 0 ? 'pulled' : index % 3 === 1 ? 'cheered' : 'joined',
    origin: 'demo',
  }))
}

export function createReactions(players: WorldPlayer[]): WorldActivity[] {
  return Array.from({ length: 20 }, (_, index) => ({
    id: `reaction_${index}`,
    actor: players[index % players.length]?.displayName ?? 'NovaWisp',
    message: index % 2 === 0 ? 'FIRE' : 'BOLT',
    origin: 'demo',
  }))
}

export function createMockWorldDataset(): MockWorldDataset {
  const players = createPlayers()
  return {
    origin: 'demo',
    generatedAt: WORLD_SEED,
    players,
    rooms: createRooms(),
    matches: createMatches(),
    missions: createMissions(),
    events: createEvents(),
    activity: createActivity(players),
    reactions: createReactions(players),
    leaderboard: {
      sunScore: 428,
      moonScore: 381,
      timeLabel: '00:42',
      roomTitle: 'Friday Night Pull',
      roomCode: '731XZ',
    },
  }
}
