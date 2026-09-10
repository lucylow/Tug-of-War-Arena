import { Vector3 } from '@dcl/sdk/math'
import { COLOR } from '../config'
import type { WorldRoom } from '../mock3d'
import { box } from '../ui/primitives'
import { worldLabel } from '../ui/labels'

export function createRoomDiscoveryBoard(rooms: WorldRoom[]): void {
  box(Vector3.create(8.4, 1.2, 7.2), Vector3.create(4.4, 2.4, 0.18), COLOR.midnight, true)
  const lines = ['ROOM DISCOVERY', ...rooms.slice(0, 5).map((room) => `${room.code} ${room.title} ${room.phase.toUpperCase()} DEMO`)]
  worldLabel(lines.join('\n'), Vector3.create(8.4, 2.6, 7.4), 0.7)
}
