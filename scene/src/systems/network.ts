import { Entity } from '@dcl/sdk/ecs'
import { syncEntity } from '@dcl/sdk/network'

import { ENABLE_NETWORK_SYNC } from '../config'
import {
  packetFromSyncedMatch,
  visualInputFromPacket,
  type RemoteArenaPacket,
} from '../logic/remote'
import { applyRemoteState } from './session'

/**
 * Optional Decentraland native sync. Keep this off for local preview.
 * A Colyseus (or tRPC) room should remain the source of pull truth; this
 * only replicates transforms that already exist in the scene.
 */
export function maybeSync(entity: Entity, componentIds: number[], networkId: number) {
  if (!ENABLE_NETWORK_SYNC) return
  syncEntity(entity, componentIds, networkId)
}

export type { RemoteArenaPacket }
export { packetFromSyncedMatch, visualInputFromPacket }

export type ArenaTransport = {
  sendPull: (amount: number) => void
  onPacket: (handler: (packet: RemoteArenaPacket) => void) => void
}

/**
 * Drop-in boundary for a future Colyseus room. The demo loop never calls this
 * unless a transport is registered from `index.ts`.
 */
let transport: ArenaTransport | null = null

export function registerArenaTransport(next: ArenaTransport) {
  transport = next
}

export function getArenaTransport() {
  return transport
}

export function applyTransportPacket(packet: RemoteArenaPacket) {
  applyRemoteState(visualInputFromPacket(packet))
}
