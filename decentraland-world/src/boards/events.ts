import { gold } from '../palette'
import { box, cylinder } from '../entities/primitives'
import { worldLabel } from '../logic/labels'
import { setupInteraction } from '../systems/interaction'

const EVENTS = [
  { title: 'Sun vs Moon Cup', type: 'cup', status: 'upcoming', time: '12:42' },
  { title: 'Weekend Pull', type: 'weekend', status: 'live', time: 'now' },
  { title: 'Crew Rush', type: 'rush', status: 'upcoming', time: '18:00' },
  { title: 'Achievement Hunt', type: 'hunt', status: 'upcoming', time: '20:00' },
  { title: 'Friendzone Rally', type: 'rally', status: 'upcoming', time: '21:30' },
]

export function createEventPlaza(onSelect: (title: string) => void): void {
  worldLabel({ x: 8, y: 4.4, z: 26 }, 'EVENT PLAZA', gold, 1.05)
  EVENTS.forEach((event, index) => {
    const x = 5.2 + index * 1.5
    const pedestal = cylinder(undefined, { x, y: 0.8, z: 26 }, { x: 0.55, y: 1.6, z: 0.55 }, index % 2 === 0 ? 'sun' : 'moon', {
      collider: true,
    })
    worldLabel({ x, y: 2.2, z: 26 }, `${event.title}\n${event.type}\n${event.status}\n${event.time}`, gold, 0.55)
    setupInteraction(pedestal, () => onSelect(event.title), event.title)
  })
  box(undefined, { x: 8, y: 0.08, z: 26 }, { x: 8.4, y: 0.1, z: 3.2 }, 'neutral')
}
