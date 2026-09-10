import type { MockWorldDataset } from './types'

export function worldMetrics(data: MockWorldDataset) {
  return {
    demoPlayers: data.players.length,
    demoOnline: data.players.filter((player) => player.presence === 'online').length,
    demoRooms: data.rooms.length,
    demoEvents: data.events.length,
    origin: 'demo' as const,
  }
}
