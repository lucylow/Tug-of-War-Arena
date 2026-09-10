import { Vector3 } from '@dcl/sdk/math'

import { box } from '../entities/primitives'
import { setupInteraction } from '../systems/interaction'
import { worldLabel } from '../ui/labels'

export function createAchievementTerminal(): void {
  const terminal = box(undefined, { x: 27.4, y: 1.1, z: 24.4 }, { x: 1.8, y: 2.0, z: 1.4 }, 'highlight', { collider: true })
  worldLabel('BLOCKCHAIN ACHIEVEMENT TERMINAL', Vector3.create(27.4, 2.6, 24.4), 0.8)
  worldLabel('DEMO WALLET', Vector3.create(27.4, 2.15, 24.4), 0.7)
  setupInteraction(terminal, () => undefined, 'ACHIEVEMENT TERMINAL')
}
