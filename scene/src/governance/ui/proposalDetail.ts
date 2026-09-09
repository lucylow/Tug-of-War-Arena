import { Billboard, Entity, TextShape, Transform, VisibilityComponent, engine } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
import type { Color4 } from '@dcl/sdk/math'

import type { DaoProposal } from '../types'
import { compactTitle } from '../services/format'
import { GOVERNANCE_COLORS } from '../visual/materialFactory'

export interface ProposalDetailPanel {
  root: Entity
  title: Entity
  body: Entity
}

export function createProposalDetailPanel(position: Vector3): ProposalDetailPanel {
  const root = engine.addEntity()
  Transform.create(root, { position })
  const title = addText('SELECT A PROPOSAL', Vector3.create(position.x, position.y + 0.55, position.z), 0.55, GOVERNANCE_COLORS.pink)
  const body = addText(
    'Walk up to a proposal pedestal and explore the official DAO workflow.',
    Vector3.create(position.x, position.y, position.z),
    0.32,
    GOVERNANCE_COLORS.white,
  )
  VisibilityComponent.create(root, { visible: true })
  return { root, title, body }
}

export function showProposalDetail(panel: ProposalDetailPanel, proposal: DaoProposal): void {
  VisibilityComponent.getMutable(panel.root).visible = true
  TextShape.getMutable(panel.title).text = compactTitle(proposal.title, 42)
  TextShape.getMutable(panel.body).text = `${proposal.summary} • ${proposal.stage.toUpperCase()} • ${proposal.yesPercent}% YES`
}

function addText(text: string, position: Vector3, fontSize: number, textColor: Color4): Entity {
  const entity = engine.addEntity()
  Transform.create(entity, { position })
  Billboard.create(entity)
  TextShape.create(entity, { text, fontSize, textColor })
  return entity
}
