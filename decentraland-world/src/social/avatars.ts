import { Transform } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

import { box } from '../entities/primitives'
import { worldLabel } from '../logic/labels'
import { gold } from '../palette'
import { isFeaturedPlayer, isNearArena, isVisibleArea } from '../logic/mapping'

const FEATURED = ['NovaWisp', 'PixelRally', 'RopeWizard']

const PLAYERS = [
  { id: 'NovaWisp', team: 'sun' as const, x: 6, z: 16 },
  { id: 'PixelRally', team: 'moon' as const, x: 26, z: 16 },
  { id: 'MoonRunner', team: 'moon' as const, x: 20, z: 14 },
  { id: 'SunSpark', team: 'sun' as const, x: 12, z: 22 },
  { id: 'RopeWizard', team: 'sun' as const, x: 7, z: 14 },
]

const WAYPOINTS = [
  { x: 6, z: 16 },
  { x: 16, z: 16 },
  { x: 26, z: 16 },
  { x: 16, z: 24 },
]

export function createAvatars(): Array<{ id: string; move: (tick: number) => void }> {
  return PLAYERS.map((player, index) => {
    const body = box(undefined, { x: player.x, y: 0.9, z: player.z }, { x: 0.55, y: 1.4, z: 0.4 }, player.team)
    const label = worldLabel({ x: player.x, y: 1.9, z: player.z }, player.id, gold, 0.55)
    return {
      id: player.id,
      move(tick: number) {
        const featured = isFeaturedPlayer(player.id, FEATURED)
        const near = isNearArena(player.x, player.z)
        if (!featured && !near && tick % 8 !== 0) return
        const waypoint = WAYPOINTS[(index + Math.floor(tick / 4)) % WAYPOINTS.length]!
        const dx = (waypoint.x - player.x) * 0.08
        const dz = (waypoint.z - player.z) * 0.08
        player.x += dx
        player.z += dz
        if (!isVisibleArea(Math.hypot(player.x - 16, player.z - 16))) return
        Transform.getMutable(body).position = Vector3.create(player.x, 0.9, player.z)
        Transform.getMutable(label).position = Vector3.create(player.x, 1.9, player.z)
      },
    }
  })
}
