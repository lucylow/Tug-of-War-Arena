import { COPY } from '../copy'
import { gold } from '../palette'
import { box } from '../entities/primitives'
import { worldLabel } from '../logic/labels'
import { setupInteraction } from '../systems/interaction'

export function createRematchArea(onRematch: () => void, onCrew: () => void, onBoard: () => void): void {
  box(undefined, { x: 16, y: 0.22, z: 21.6 }, { x: 4.4, y: 0.28, z: 3.2 }, 'highlight', { collider: true, intensity: 1.5 })
  worldLabel({ x: 16, y: 1.4, z: 21.6 }, COPY.rematch, gold, 1.35)
  const rematch = box(undefined, { x: 16, y: 0.28, z: 21.6 }, { x: 3.6, y: 0.2, z: 2.2 }, 'highlight', { collider: true })
  setupInteraction(rematch, onRematch, COPY.rematch)
  const crew = box(undefined, { x: 13.6, y: 0.22, z: 23.2 }, { x: 1.8, y: 0.18, z: 1.2 }, 'sun', { collider: true })
  setupInteraction(crew, onCrew, 'Return to crew')
  const board = box(undefined, { x: 18.4, y: 0.22, z: 23.2 }, { x: 1.8, y: 0.18, z: 1.2 }, 'moon', { collider: true })
  setupInteraction(board, onBoard, 'View leaderboard')
}
