import { Entity, MeshCollider, MeshRenderer, Transform, engine } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

import { POINTER_MAX_DISTANCE } from '../../logic/mobileRuntime'
import { setupInteraction } from '../../systems/interaction'
import { formatVp } from '../services/format'
import type { DaoOverview } from '../types'
import { GOVERNANCE_COLORS, paint } from '../visual/materialFactory'
import { addGovernanceLabel } from './labels'

export function createWorkflowBoard(overview: DaoOverview, position: Vector3, onOpenDao: () => void): Entity {
  const board = engine.addEntity()
  Transform.create(board, { position, scale: Vector3.create(4.8, 2.55, 0.18) })
  MeshRenderer.setBox(board)
  MeshCollider.setBox(board)
  paint(board, GOVERNANCE_COLORS.panel)

  addGovernanceLabel('DAO GOVERNANCE PATH', Vector3.create(position.x, position.y + 0.95, position.z - 0.16), 0.7, GOVERNANCE_COLORS.pink)
  addGovernanceLabel('POLL  →  DRAFT  →  GOVERNANCE', Vector3.create(position.x, position.y + 0.55, position.z - 0.16), 0.38, GOVERNANCE_COLORS.sun)

  overview.workflow.forEach((step, index) => {
    const y = position.y + 0.12 - index * 0.42
    addGovernanceLabel(
      `${index + 1}. ${step.label} • ${formatVp(step.thresholdVP)} • ${step.duration}`,
      Vector3.create(position.x, y, position.z - 0.16),
      0.32,
      index === 2 ? GOVERNANCE_COLORS.sun : GOVERNANCE_COLORS.white,
    )
  })

  setupInteraction(board, onOpenDao, 'Open official governance', POINTER_MAX_DISTANCE)
  return board
}
