import { Entity, MeshCollider, MeshRenderer, Transform, engine } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
import type { Color4 } from '@dcl/sdk/math'

import { POINTER_MAX_DISTANCE } from '../../logic/mobileRuntime'
import { setupInteraction } from '../../systems/interaction'
import { GOVERNANCE_COLORS, paint } from '../visual/materialFactory'
import { addGovernanceLabel } from './labels'

export interface GovernanceTerminalRefs {
  dao: Entity
  forum: Entity
}

export function createGovernanceTerminal(
  position: Vector3,
  openDao: () => void,
  openForum: () => void,
  daoColor: Color4,
  forumColor: Color4,
): GovernanceTerminalRefs {
  const dao = createTerminalButton(
    Vector3.create(position.x - 1.15, position.y, position.z),
    daoColor,
    'Open official DAO',
    openDao,
    'OPEN DAO',
  )
  const forum = createTerminalButton(
    Vector3.create(position.x + 1.15, position.y, position.z),
    forumColor,
    'Open DAO forum',
    openForum,
    'DAO FORUM',
  )
  return { dao, forum }
}

function createTerminalButton(
  position: Vector3,
  color: Color4,
  hoverText: string,
  action: () => void,
  label: string,
): Entity {
  const entity = engine.addEntity()
  Transform.create(entity, { position, scale: Vector3.create(1.8, 0.22, 0.75) })
  MeshRenderer.setBox(entity)
  MeshCollider.setBox(entity)
  paint(entity, color, { emissive: color, emissiveIntensity: 1.1 })
  addGovernanceLabel(label, Vector3.create(position.x, position.y + 0.38, position.z), 0.36, GOVERNANCE_COLORS.white)
  setupInteraction(entity, action, hoverText, POINTER_MAX_DISTANCE)
  return entity
}
