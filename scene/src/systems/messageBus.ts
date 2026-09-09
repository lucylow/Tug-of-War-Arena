import { MessageBus } from '@dcl/sdk/message-bus'

import { DEMO_CREW_BOARD, formatCrewBoardText, withJoinedPlayer } from '../logic/crewBoard'
import {
  WORLD_BRIDGE_CHANNEL,
  encodeWorldBridgeEvent,
  parseWorldBridgeEvent,
  type WorldBridgeEvent,
} from '../logic/worldBridge'
import { updateCrewBoardText } from '../entities/crewBoard'
import { spawnWorldReaction } from '../social/reactions'
import { applyWorldBridgeEvent, session } from './session'

let bus: MessageBus | null = null
let ready = false

export function setupWorldBus(): MessageBus | null {
  if (ready) return bus
  try {
    bus = new MessageBus()
    bus.on(WORLD_BRIDGE_CHANNEL, (raw: unknown) => {
      const event = parseWorldBridgeEvent(raw)
      if (!event) return
      applyWorldBridgeEvent(event)
      if (event.type === 'reaction') {
        spawnWorldReaction(event.emoji, event.from)
      }
      if (event.type === 'join') {
        spawnWorldReaction(event.crew === 'sun' ? '☀️' : '🌙', event.name ?? 'Crew join')
        updateCrewBoardText(
          formatCrewBoardText(withJoinedPlayer(DEMO_CREW_BOARD, session.playerName, event.crew)),
        )
      }
    })
    ready = true
    return bus
  } catch (error) {
    console.log('[world-bus] MessageBus unavailable', error)
    bus = null
    ready = true
    return null
  }
}

export function emitWorldEvent(event: WorldBridgeEvent): void {
  const payload = encodeWorldBridgeEvent(event)
  if (bus) {
    bus.emit(WORLD_BRIDGE_CHANNEL, payload)
    return
  }
  applyWorldBridgeEvent(event)
  if (event.type === 'reaction') spawnWorldReaction(event.emoji, event.from)
  if (event.type === 'join') {
    spawnWorldReaction(event.crew === 'sun' ? '☀️' : '🌙', event.name ?? 'Crew join')
    updateCrewBoardText(
      formatCrewBoardText(withJoinedPlayer(DEMO_CREW_BOARD, session.playerName, event.crew)),
    )
  }
}
