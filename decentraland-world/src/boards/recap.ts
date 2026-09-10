import { gold } from '../palette'
import { box } from '../entities/primitives'
import { worldLabel } from '../logic/labels'
import { setupInteraction } from '../systems/interaction'

export function createRecapBoard(onRematch: () => void): void {
  box(undefined, { x: 16, y: 1.6, z: 22.8 }, { x: 4.8, y: 2.8, z: 0.28 }, 'arena')
  worldLabel({ x: 16, y: 3.3, z: 22.9 }, 'MATCH RECAP', gold, 1.1)
  worldLabel({ x: 16, y: 2.7, z: 22.9 }, 'YOU WON\n428 PULLS\n🔥 4 STREAK\nMISSION: 84/100', gold, 0.85)
  const pad = box(undefined, { x: 16, y: 0.2, z: 22.2 }, { x: 2.4, y: 0.16, z: 1.2 }, 'highlight', { collider: true })
  setupInteraction(pad, onRematch, 'REMATCH')
}
