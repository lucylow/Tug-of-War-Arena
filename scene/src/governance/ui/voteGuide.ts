import { Entity, MeshCollider, MeshRenderer, Transform, engine } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

import { POINTER_MAX_DISTANCE } from '../../logic/mobileRuntime'
import { setupInteraction } from '../../systems/interaction'
import { GOVERNANCE_COLORS, paint } from '../visual/materialFactory'
import { addGovernanceLabel } from './labels'

export function createVoteGuide(position: Vector3, onOpenDao: () => void): Entity {
  const panel = engine.addEntity()
  Transform.create(panel, { position, scale: Vector3.create(3.6, 2.7, 0.18) })
  MeshRenderer.setBox(panel)
  MeshCollider.setBox(panel)
  paint(panel, GOVERNANCE_COLORS.panel)

  addGovernanceLabel('HOW TO PARTICIPATE', Vector3.create(position.x, position.y + 0.95, position.z - 0.14), 0.58, GOVERNANCE_COLORS.pink)
  addGovernanceLabel('1  CONNECT A WALLET', Vector3.create(position.x, position.y + 0.42, position.z - 0.14), 0.34, GOVERNANCE_COLORS.white)
  addGovernanceLabel('2  REVIEW PROPOSAL', Vector3.create(position.x, position.y + 0.02, position.z - 0.14), 0.34, GOVERNANCE_COLORS.white)
  addGovernanceLabel('3  VOTE IN OFFICIAL DAO', Vector3.create(position.x, position.y - 0.38, position.z - 0.14), 0.34, GOVERNANCE_COLORS.white)
  addGovernanceLabel(
    'THIS WORLD DOES NOT CAST BINDING VOTES',
    Vector3.create(position.x, position.y - 0.88, position.z - 0.14),
    0.24,
    GOVERNANCE_COLORS.sun,
  )

  setupInteraction(panel, onOpenDao, 'Open official DAO', POINTER_MAX_DISTANCE)
  return panel
}
