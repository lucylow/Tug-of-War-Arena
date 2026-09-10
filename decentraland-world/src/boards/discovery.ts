import { gold } from '../palette'
import { box } from '../entities/primitives'
import { worldLabel } from '../logic/labels'
import { setupInteraction } from '../systems/interaction'

const ITEMS = [
  { title: 'ROOMS', dest: 'rooms' },
  { title: 'EVENTS', dest: 'events' },
  { title: 'CREWS', dest: 'crew' },
  { title: 'GOVERNANCE', dest: 'governance' },
  { title: 'ACHIEVEMENTS', dest: 'achievements' },
]

export function createDiscoveryBoard(onSelect: (dest: string) => void): void {
  box(undefined, { x: 16, y: 1.8, z: 7.4 }, { x: 5.6, y: 2.6, z: 0.22 }, 'arena')
  worldLabel({ x: 16, y: 3.3, z: 7.5 }, 'DISCOVER', gold, 1)
  ITEMS.forEach((item, index) => {
    const x = 13.4 + index * 1.3
    const pad = box(undefined, { x, y: 1.4, z: 7.5 }, { x: 1.1, y: 0.9, z: 0.16 }, 'neutral', { collider: true })
    worldLabel({ x, y: 1.55, z: 7.6 }, item.title, gold, 0.5)
    setupInteraction(pad, () => onSelect(item.dest), item.title)
  })
}
