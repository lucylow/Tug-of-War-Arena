import { Transform } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

import { gold } from '../palette'
import { box } from '../entities/primitives'
import { worldLabel } from '../logic/labels'
import { setupInteraction } from '../systems/interaction'
import { registerTemporaryEntity } from '../systems/temporaryEntities'

const REACTIONS = ['🔥', '👏', '💪', '❤️'] as const

export function createReactionStation(onReact: (emoji: string) => void): void {
  worldLabel({ x: 16, y: 2.6, z: 24.4 }, "WHAT'S HAPPENING", gold, 0.9)
  REACTIONS.forEach((emoji, index) => {
    const x = 14.2 + index * 1.2
    const pad = box(undefined, { x, y: 0.2, z: 24.4 }, { x: 0.9, y: 0.18, z: 0.9 }, 'highlight', { collider: true })
    worldLabel({ x, y: 0.7, z: 24.4 }, emoji, gold, 0.9)
    setupInteraction(pad, () => {
      onReact(emoji)
      spawnReaction(x, emoji)
    }, emoji)
  })
}

export function spawnReaction(x: number, emoji: string, from = 'NovaWisp'): void {
  const label = worldLabel({ x, y: 1.4, z: 24.4 }, `${from} reacted ${emoji}`, gold, 0.7)
  registerTemporaryEntity(label, 2200, 'reaction')
  if (Transform.has(label)) {
    Transform.getMutable(label).position = Vector3.create(x, 1.8, 24.4)
  }
}

export function createActivityBoard(lines: string[]): ReturnType<typeof worldLabel> {
  const text = lines.slice(0, 6).join('\n')
  return worldLabel({ x: 16, y: 3.5, z: 24.4 }, text || 'NovaWisp joined', gold, 0.7)
}

export function createPresenceBoard(): void {
  box(undefined, { x: 19.6, y: 1.6, z: 24.6 }, { x: 2.8, y: 2.2, z: 0.2 }, 'arena')
  worldLabel({ x: 19.6, y: 2.8, z: 24.7 }, 'ONLINE  ●  AWAY  ○  OFFLINE', gold, 0.62)
  worldLabel({ x: 19.6, y: 2.3, z: 24.7 }, '☀ Sun  ·  ☾ Moon', gold, 0.62)
}
