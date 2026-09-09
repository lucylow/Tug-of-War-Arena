import { Vector3 } from '@dcl/sdk/math'

import {
  getGovernanceBadgesPosition,
  getGovernanceOverviewPosition,
  getGovernancePlazaPosition,
  getGovernanceTerminalPosition,
  getGovernanceVoteGuidePosition,
  getGovernanceWorkflowBoardPosition,
  getProposalPedestalPosition,
} from '../logic/journey'
import { GovernanceController } from './controller'
import { createGovernanceState, selectProposal } from './state'
import { openDao, openDiscussion, openForum, openProposal, openSnapshot } from './services/links'
import { createGovernanceBadges } from './ui/badges'
import { createGovernanceOverviewBoard } from './ui/overviewBoard'
import { createGovernanceAccents } from './ui/particleAccent'
import { buildGovernancePavilion } from './ui/pavilion'
import { createProposalDetailPanel, showProposalDetail } from './ui/proposalDetail'
import { createProposalMetrics } from './ui/metrics'
import { createProposalStatus } from './ui/proposalStatus'
import { createGovernanceTerminal } from './ui/terminal'
import { createVoteGuide } from './ui/voteGuide'
import { createWorkflowBoard } from './ui/workflowBoard'
import { GOVERNANCE_COLORS } from './visual/materialFactory'

/**
 * Physical DAO plaza north of the rope: pedestals, workflow board, terminals, and official-link bridges.
 * Binding votes stay on governance.decentraland.org.
 */
export function buildGovernanceExperience(): void {
  const state = createGovernanceState()
  const controller = new GovernanceController(state)
  controller.refresh()

  const overview = state.overview
  const plaza = getGovernancePlazaPosition()
  const plazaVec = Vector3.create(plaza.x, plaza.y, plaza.z)

  const detail = createProposalDetailPanel(Vector3.create(plaza.x, 3.55, plaza.z + 0.2))

  buildGovernancePavilion(overview.proposals, plazaVec, {
    openDao,
    openForum,
    openProposal,
    openDiscussion,
    openSnapshot,
    onSelect: (proposal) => {
      selectProposal(state, proposal.id)
      showProposalDetail(detail, proposal)
    },
  })

  createGovernanceOverviewBoard(overview, Vector3.create(
    getGovernanceOverviewPosition().x,
    getGovernanceOverviewPosition().y,
    getGovernanceOverviewPosition().z,
  ))

  const voteGuide = getGovernanceVoteGuidePosition()
  createVoteGuide(Vector3.create(voteGuide.x, voteGuide.y, voteGuide.z), openDao)

  const badges = getGovernanceBadgesPosition()
  createGovernanceBadges(Vector3.create(badges.x, badges.y, badges.z))

  createGovernanceAccents(plazaVec)

  const terminal = getGovernanceTerminalPosition()
  createGovernanceTerminal(
    Vector3.create(terminal.x, terminal.y, terminal.z),
    openDao,
    openForum,
    GOVERNANCE_COLORS.pink,
    GOVERNANCE_COLORS.purple,
  )

  const workflow = getGovernanceWorkflowBoardPosition()
  createWorkflowBoard(overview, Vector3.create(workflow.x, workflow.y, workflow.z), openDao)

  overview.proposals.slice(0, 3).forEach((proposal, index) => {
    const slot = getProposalPedestalPosition(index)
    createProposalStatus(proposal, Vector3.create(slot.x, 3.2, slot.z + 0.35))
    createProposalMetrics(proposal, Vector3.create(slot.x, 1.65, slot.z + 1.15))
  })
}
