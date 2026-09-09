import { DAO_PORTAL_URL, DAO_SOURCE_NOTE, DAO_VOTING_POWER_TEXT, DAO_WORKFLOW } from '../constants'
import type { DaoOverview } from '../types'
import { demoProposals } from './demoProposals'

export function createDemoDaoOverview(): DaoOverview {
  return {
    votingPowerEligibility: 'MANA / LAND / NAME holders',
    votingPowerNote: DAO_VOTING_POWER_TEXT,
    workflow: [
      {
        stage: 'pre-proposal',
        label: DAO_WORKFLOW.preProposal.label,
        goal: DAO_WORKFLOW.preProposal.goal,
        thresholdVP: DAO_WORKFLOW.preProposal.thresholdVP,
        duration: DAO_WORKFLOW.preProposal.duration,
      },
      {
        stage: 'draft',
        label: DAO_WORKFLOW.draft.label,
        goal: DAO_WORKFLOW.draft.goal,
        thresholdVP: DAO_WORKFLOW.draft.thresholdVP,
        duration: DAO_WORKFLOW.draft.duration,
      },
      {
        stage: 'governance',
        label: DAO_WORKFLOW.governance.label,
        goal: DAO_WORKFLOW.governance.goal,
        thresholdVP: DAO_WORKFLOW.governance.thresholdVP,
        duration: DAO_WORKFLOW.governance.duration,
      },
    ],
    proposals: demoProposals,
    sourceUrl: DAO_PORTAL_URL,
    fetchedAt: new Date().toISOString(),
    mode: 'demo',
  }
}

export function sourceNote(): string {
  return DAO_SOURCE_NOTE
}
