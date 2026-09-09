import { normalizeTeam, type CrewId, type TeamAlias } from './mapping'

/**
 * Narrow event contract between the Expo companion and this SDK7 world.
 * The deployed link should use a real network; this file is the seam.
 */
export const WORLD_BRIDGE_CHANNEL = 'tug-of-war-arena'

export type WorldBridgePull = {
  type: 'pull'
  amount: number
  crew?: CrewId
}

export type WorldBridgeReaction = {
  type: 'reaction'
  emoji: string
  from?: string
}

export type WorldBridgeJoin = {
  type: 'join'
  crew: CrewId
  name?: string
}

export type WorldBridgeRematch = {
  type: 'rematch'
}

export type WorldBridgeEvent =
  | WorldBridgePull
  | WorldBridgeReaction
  | WorldBridgeJoin
  | WorldBridgeRematch

const EMOJI_MAX = 8
const NAME_MAX = 24

function asRecord(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  return raw as Record<string, unknown>
}

function clip(value: string, max: number): string {
  return value.trim().slice(0, max)
}

export function parseWorldBridgeEvent(raw: unknown): WorldBridgeEvent | null {
  const data = asRecord(raw)
  if (!data || typeof data.type !== 'string') return null

  if (data.type === 'pull') {
    const amount = Number(data.amount)
    if (!Number.isFinite(amount) || amount <= 0) return null
    const crew = typeof data.crew === 'string' ? normalizeTeam(data.crew as TeamAlias) : undefined
    return { type: 'pull', amount: Math.min(8, Math.max(1, Math.floor(amount))), crew }
  }

  if (data.type === 'reaction') {
    if (typeof data.emoji !== 'string' || data.emoji.trim().length === 0) return null
    const from = typeof data.from === 'string' ? clip(data.from, NAME_MAX) : undefined
    return { type: 'reaction', emoji: clip(data.emoji, EMOJI_MAX), from }
  }

  if (data.type === 'join') {
    if (typeof data.crew !== 'string') return null
    const name = typeof data.name === 'string' ? clip(data.name, NAME_MAX) : undefined
    return { type: 'join', crew: normalizeTeam(data.crew as TeamAlias), name }
  }

  if (data.type === 'rematch') {
    return { type: 'rematch' }
  }

  return null
}

export function encodeWorldBridgeEvent(event: WorldBridgeEvent): Record<string, unknown> {
  if (event.type === 'pull') {
    return { type: 'pull', amount: event.amount, ...(event.crew ? { crew: event.crew } : {}) }
  }
  if (event.type === 'reaction') {
    return { type: 'reaction', emoji: event.emoji, ...(event.from ? { from: event.from } : {}) }
  }
  if (event.type === 'join') {
    return { type: 'join', crew: event.crew, ...(event.name ? { name: event.name } : {}) }
  }
  return { type: 'rematch' }
}
