import { Vector3 } from '@dcl/sdk/math'
import { COLOR, EVENTS } from '../config'
import type { WorldEvent } from '../mock3d'
import { box, cylinder } from '../ui/primitives'
import { worldLabel } from '../ui/labels'
import { onPointer } from '../systems/interaction'

export function createEventBoard(events: WorldEvent[]): void {
  box(Vector3.create(EVENTS.x, 1.1, EVENTS.z), Vector3.create(8.5, 2.2, 0.2), COLOR.midnight, true)
  worldLabel('EVENT BOARD\nDEMO', Vector3.create(EVENTS.x, 2.8, EVENTS.z + 0.2), 1)
  events.slice(0, 8).forEach((event, index) => {
    const x = EVENTS.x - 3.2 + index * 0.9
    const marker = cylinder(Vector3.create(x, 0.45, EVENTS.z + 1.1), Vector3.create(0.28, 0.9, 0.28), COLOR.gold, true)
    worldLabel(event.title, Vector3.create(x, 1.5, EVENTS.z + 1.1), 0.45)
    onPointer(marker, `DEMO ${event.title}`, () => {
      console.log('[world] event', event.id)
    })
  })
}
