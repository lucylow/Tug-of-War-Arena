import { gold } from '../palette'
import { box } from '../entities/primitives'
import { worldLabel } from '../logic/labels'
import { setupInteraction } from '../systems/interaction'

const ROOMS = [
  { title: 'Friday Night Pull', code: '731XZ', fill: '5/8' },
  { title: 'Crew Warmup', code: '92KQF', fill: '3/8' },
  { title: 'Champion Queue', code: '4JTZ2', fill: '7/8' },
]

export function createRoomKiosks(onSelect: (code: string) => void): void {
  worldLabel({ x: 6.4, y: 3.4, z: 21.8 }, 'ACTIVE ROOMS', gold, 0.9)
  ROOMS.forEach((room, index) => {
    const z = 20.4 - index * 1.15
    const kiosk = box(undefined, { x: 6.4, y: 1.1, z }, { x: 2.4, y: 1.8, z: 0.28 }, 'arena', { collider: true })
    worldLabel({ x: 6.4, y: 2.2, z }, `${room.title}\n${room.code}\n${room.fill}`, gold, 0.62)
    setupInteraction(kiosk, () => onSelect(room.code), room.title)
  })
}
