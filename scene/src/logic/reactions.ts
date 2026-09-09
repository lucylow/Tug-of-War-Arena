import { ARENA_CENTER, clamp, type Vec3 } from './mapping'

export const REACTION_LIFETIME = 2.4
export const MAX_LIVE_REACTIONS = 8

export type ReactionPose = {
  position: Vec3
  scale: number
  alive: boolean
  t: number
}

export function reactionOrigin(index: number = 0): Vec3 {
  const swing = ((index % 5) - 2) * 0.55
  return { x: ARENA_CENTER.x + swing, y: 2.4, z: ARENA_CENTER.z - 2.2 }
}

export function reactionPose(age: number, origin: Vec3, lifetime: number = REACTION_LIFETIME): ReactionPose {
  const t = clamp(age / Math.max(0.01, lifetime), 0, 1)
  return {
    position: {
      x: origin.x,
      y: origin.y + t * 2.2,
      z: origin.z,
    },
    scale: 1 + (1 - t) * 0.25,
    alive: age < lifetime,
    t,
  }
}

export function formatReactionText(emoji: string, from?: string): string {
  const mark = emoji.trim() || '🔥'
  return from && from.trim().length > 0 ? `${mark}  ${from.trim()}` : mark
}
