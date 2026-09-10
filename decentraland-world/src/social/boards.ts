import { Vector3 } from '@dcl/sdk/math'

import { box, sphere, tintedBox } from '../entities/primitives'
import { createMockWorldDataset } from '../mock3d'
import { teamColor } from '../palette'
import { worldLabel } from '../ui/labels'

export function createPlayerMarkers(): void {
  const dataset = createMockWorldDataset()
  for (const player of dataset.players) {
    const marker = tintedBox(
      { x: player.worldPosition.x, y: 0.7, z: player.worldPosition.z },
      { x: 0.55, y: 1.2, z: 0.55 },
      teamColor(player.team),
    )
    void marker
    worldLabel(player.displayName, Vector3.create(player.worldPosition.x, 1.7, player.worldPosition.z), 0.7)
  }
}

export function createSocialBoards(): void {
  const dataset = createMockWorldDataset()
  const online = dataset.players.filter((player) => player.presence === 'online').slice(0, 6)
  box(undefined, { x: 5.2, y: 1.6, z: 20.8 }, { x: 4.2, y: 2.4, z: 0.28 }, 'sun', { collider: true })
  worldLabel(['CREW ONLINE', ...online.map((player) => player.displayName), 'DEMO'].join('\n'), Vector3.create(5.2, 3.4, 20.8), 0.7)

  box(undefined, { x: 16, y: 0.16, z: 8.6 }, { x: 5.2, y: 0.18, z: 2.2 }, 'highlight', { collider: true })
  worldLabel('SOCIAL REACTIONS\nCLICK TO CHEER  DEMO', Vector3.create(16, 1.2, 8.6), 0.8)

  box(undefined, { x: 8.4, y: 1.4, z: 27.2 }, { x: 5.6, y: 2.6, z: 0.35 }, 'neutral', { collider: true })
  worldLabel('ROOM BOARD', Vector3.create(8.4, 3.1, 27.2), 1.1)
  dataset.rooms.forEach((room, index) => {
    worldLabel(`${room.title}  ${room.code}`, Vector3.create(8.4, 2.5 - index * 0.35, 27.2), 0.7)
  })

  box(undefined, { x: 16, y: 1.4, z: 28.6 }, { x: 6.4, y: 2.6, z: 0.35 }, 'highlight', { collider: true })
  worldLabel('EVENT BOARD', Vector3.create(16, 3.1, 28.6), 1.1)
  dataset.events.forEach((event, index) => {
    worldLabel(`${event.title}`, Vector3.create(16, 2.5 - index * 0.28, 28.6), 0.65)
    sphere(undefined, { x: 12 + (index % 8) * 1.05, y: 0.45, z: 26.2 }, { x: 0.35, y: 0.45, z: 0.35 }, index % 2 === 0 ? 'sun' : 'moon')
  })

  box(undefined, { x: 23.6, y: 1.4, z: 27.2 }, { x: 5.6, y: 2.6, z: 0.35 }, 'arena', { collider: true })
  worldLabel('MISSION BOARD', Vector3.create(23.6, 3.1, 27.2), 1.1)
  dataset.missions.forEach((mission, index) => {
    worldLabel(`${mission.title}  ${mission.progress}/${mission.target}`, Vector3.create(23.6, 2.5 - index * 0.35, 27.2), 0.7)
  })
}
