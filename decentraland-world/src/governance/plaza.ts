import { Vector3 } from '@dcl/sdk/math'

import { box } from '../entities/primitives'
import { setupInteraction } from '../systems/interaction'
import { worldLabel } from '../ui/labels'

export function createGovernancePlaza(): void {
  box(undefined, { x: 16, y: 0.2, z: 24.6 }, { x: 10, y: 0.2, z: 6 }, 'glass', { collider: true })
  worldLabel('DAO GOVERNANCE PLAZA', Vector3.create(16, 3.2, 24.6), 1.25)
  worldLabel('DEMO PROPOSAL', Vector3.create(12.4, 2.4, 24.6), 0.9)
  worldLabel('WORKFLOW BOARD', Vector3.create(16, 2.4, 24.6), 0.9)
  worldLabel('FORUM TERMINAL', Vector3.create(19.6, 2.4, 24.6), 0.9)
  const terminal = box(undefined, { x: 16, y: 1.1, z: 23.2 }, { x: 1.6, y: 1.8, z: 1.1 }, 'highlight', { collider: true })
  worldLabel('DAO TERMINAL', Vector3.create(16, 2.3, 23.2), 0.85)
  setupInteraction(terminal, () => undefined, 'GOVERNANCE')
}
