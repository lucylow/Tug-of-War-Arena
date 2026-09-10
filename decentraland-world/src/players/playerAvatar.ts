import { Vector3 } from '@dcl/sdk/math'
import { COLOR } from '../config'
import type { WorldPlayer } from '../mock3d'
import { cylinder, sphere } from '../ui/primitives'
import { worldLabel } from '../ui/labels'

export function spawnPlayerAvatars(players: WorldPlayer[]): void {
  for (const player of players) {
    const color = player.team === 'sun' ? COLOR.sun : COLOR.moon
    const position = Vector3.create(player.worldPosition.x, player.worldPosition.y, player.worldPosition.z)
    cylinder(position, Vector3.create(0.35, 1.1, 0.35), color)
    sphere(Vector3.create(player.worldPosition.x, player.worldPosition.y + 0.85, player.worldPosition.z), Vector3.create(0.28, 0.28, 0.28), COLOR.cloud)
    sphere(Vector3.create(player.worldPosition.x, player.worldPosition.y + 0.35, player.worldPosition.z + 0.22), Vector3.create(0.12, 0.12, 0.12), color)
    worldLabel(`${player.displayName}\nDEMO`, Vector3.create(player.worldPosition.x, player.worldPosition.y + 1.7, player.worldPosition.z), 0.7)
  }
}
