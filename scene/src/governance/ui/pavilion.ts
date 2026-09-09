import { Entity, Transform, engine } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

import { box } from '../../entities/primitives'
import { POINTER_MAX_DISTANCE } from '../../logic/mobileRuntime'
import { setupInteraction } from '../../systems/interaction'
import { incrementMetric } from '../services/metrics'
import { compactTitle, formatPercent, formatVp } from '../services/format'
import type { DaoProposal, DaoStage } from '../types'
import { GOVERNANCE_COLORS, stageColor } from '../visual/materialFactory'
import { addGovernanceLabel } from './labels'

export interface GovernancePavilionRefs {
  root: Entity
  selected: Entity | null
  proposalEntities: Map<string, Entity>
}

export function buildGovernancePavilion(
  proposals: DaoProposal[],
  anchor: Vector3,
  actions: {
    openDao: () => void
    openForum: () => void
    openProposal: (proposal: DaoProposal) => void
    openDiscussion: (proposal: DaoProposal) => void
    openSnapshot: (proposal: DaoProposal) => void
    onSelect?: (proposal: DaoProposal) => void
  },
): GovernancePavilionRefs {
  const root = engine.addEntity()
  Transform.create(root, { position: anchor })

  const refs: GovernancePavilionRefs = { root, selected: null, proposalEntities: new Map() }

  box(root, { x: 0, y: 0.22, z: 0 }, { x: 12.6, y: 0.44, z: 3.1 }, GOVERNANCE_COLORS.panel, {
    roughness: 0.7,
    collider: true,
  })

  addGovernanceLabel('FRIENDZONE • DAO GOVERNANCE PLAZA', Vector3.create(0, 2.85, 0), 0.85, GOVERNANCE_COLORS.white, root)
  addGovernanceLabel(
    'EXPLORE PROPOSALS • DISCUSS • VOTE IN THE OFFICIAL DAO',
    Vector3.create(0, 2.35, 0),
    0.42,
    GOVERNANCE_COLORS.sun,
    root,
  )

  createPavilionColumns(root)
  createWorkflowTimeline(root)
  createDaoPortal(root, Vector3.create(-5.6, 1.05, 0), 'OPEN DAO', actions.openDao, GOVERNANCE_COLORS.pink)
  createDaoPortal(root, Vector3.create(5.6, 1.05, 0), 'DAO FORUM', actions.openForum, GOVERNANCE_COLORS.purple)

  proposals.slice(0, 3).forEach((proposal, index) => {
    const x = (index - 1) * 3.7
    const entity = createProposalPedestal(root, proposal, Vector3.create(x, 0.72, 0.15), refs, actions)
    refs.proposalEntities.set(proposal.id, entity)
  })

  return refs
}

function createPavilionColumns(parent: Entity): void {
  for (const x of [-5.9, 5.9]) {
    box(parent, { x, y: 1.85, z: 1.15 }, { x: 0.32, y: 3.4, z: 0.32 }, x < 0 ? GOVERNANCE_COLORS.pink : GOVERNANCE_COLORS.purple, {
      emissive: x < 0 ? GOVERNANCE_COLORS.pink : GOVERNANCE_COLORS.purple,
      emissiveIntensity: 0.9,
    })
  }
}

function createWorkflowTimeline(parent: Entity): void {
  const stages: Array<{ label: string; stage: DaoStage }> = [
    { label: '1 • POLL', stage: 'pre-proposal' },
    { label: '2 • DRAFT', stage: 'draft' },
    { label: '3 • GOVERNANCE', stage: 'governance' },
  ]
  stages.forEach((item, index) => {
    const x = -3.7 + index * 3.7
    const color = stageColor(item.stage)
    box(parent, { x, y: 0.58, z: -1.25 }, { x: 2.4, y: 0.14, z: 0.32 }, color, {
      emissive: color,
      emissiveIntensity: 1.1,
    })
    addGovernanceLabel(item.label, Vector3.create(x, 0.95, -1.25), 0.36, GOVERNANCE_COLORS.white, parent)
  })
}

function createDaoPortal(
  parent: Entity,
  position: Vector3,
  text: string,
  action: () => void,
  color: ReturnType<typeof stageColor>,
): Entity {
  const entity = box(parent, { x: position.x, y: position.y, z: position.z }, { x: 1.7, y: 0.28, z: 0.9 }, color, {
    emissive: color,
    emissiveIntensity: 1.15,
    collider: true,
  })
  addGovernanceLabel(text, Vector3.create(position.x, position.y + 0.42, position.z), 0.38, GOVERNANCE_COLORS.white, parent)
  setupInteraction(entity, action, text, POINTER_MAX_DISTANCE)
  return entity
}

function createProposalPedestal(
  parent: Entity,
  proposal: DaoProposal,
  position: Vector3,
  refs: GovernancePavilionRefs,
  actions: {
    openProposal: (proposal: DaoProposal) => void
    openDiscussion: (proposal: DaoProposal) => void
    openSnapshot: (proposal: DaoProposal) => void
    onSelect?: (proposal: DaoProposal) => void
  },
): Entity {
  const color = stageColor(proposal.stage)
  const pedestal = box(parent, { x: position.x, y: position.y, z: position.z }, { x: 3.2, y: 1.15, z: 1.55 }, GOVERNANCE_COLORS.panel, {
    roughness: 0.65,
    collider: true,
  })
  box(parent, { x: position.x, y: position.y + 0.62, z: position.z }, { x: 2.7, y: 0.08, z: 1.2 }, color, {
    emissive: color,
    emissiveIntensity: 1.2,
  })

  addGovernanceLabel(stageHeading(proposal.stage), Vector3.create(position.x, position.y + 1.18, position.z), 0.32, color, parent)
  addGovernanceLabel(compactTitle(proposal.title, 28), Vector3.create(position.x, position.y + 0.72, position.z), 0.34, GOVERNANCE_COLORS.white, parent)
  addGovernanceLabel(
    `YES ${formatPercent(proposal.yesPercent)} • ${formatVp(proposal.participatingVP)}`,
    Vector3.create(position.x, position.y + 0.28, position.z),
    0.28,
    GOVERNANCE_COLORS.white,
    parent,
  )
  addGovernanceLabel(
    proposal.isDemo ? 'DEMO PROPOSAL • CLICK TO EXPLORE' : 'LIVE PROPOSAL • CLICK TO EXPLORE',
    Vector3.create(position.x, position.y - 0.18, position.z),
    0.22,
    GOVERNANCE_COLORS.sun,
    parent,
  )

  setupInteraction(
    pedestal,
    () => {
      refs.selected = pedestal
      incrementMetric('selectedProposal')
      actions.onSelect?.(proposal)
      actions.openProposal(proposal)
    },
    'Explore proposal',
    POINTER_MAX_DISTANCE,
  )

  createProposalAction(parent, Vector3.create(position.x - 1.05, position.y + 0.12, position.z - 0.85), 'DISCUSS', () =>
    actions.openDiscussion(proposal),
    GOVERNANCE_COLORS.pink,
  )
  createProposalAction(parent, Vector3.create(position.x, position.y + 0.12, position.z - 0.85), 'SNAPSHOT', () =>
    actions.openSnapshot(proposal),
    GOVERNANCE_COLORS.purple,
  )
  createProposalAction(parent, Vector3.create(position.x + 1.05, position.y + 0.12, position.z - 0.85), 'DAO', () =>
    actions.openProposal(proposal),
    GOVERNANCE_COLORS.sun,
  )

  return pedestal
}

function createProposalAction(
  parent: Entity,
  position: Vector3,
  text: string,
  action: () => void,
  color: ReturnType<typeof stageColor>,
): Entity {
  const entity = box(parent, { x: position.x, y: position.y, z: position.z }, { x: 0.82, y: 0.1, z: 0.28 }, color, {
    emissive: color,
    emissiveIntensity: 1.05,
    collider: true,
  })
  addGovernanceLabel(text, Vector3.create(position.x, position.y + 0.18, position.z), 0.2, GOVERNANCE_COLORS.white, parent)
  setupInteraction(entity, action, text, POINTER_MAX_DISTANCE)
  return entity
}

function stageHeading(stage: DaoStage): string {
  if (stage === 'pre-proposal') return 'PRE-PROPOSAL POLL'
  if (stage === 'draft') return 'DRAFT PROPOSAL'
  if (stage === 'governance') return 'GOVERNANCE PROPOSAL'
  return stage.toUpperCase()
}
