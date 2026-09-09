import { createDemoDaoOverview } from './data/overview'
import type { GovernanceWorldState } from './types'

export function createGovernanceState(): GovernanceWorldState {
  return {
    selectedProposalId: null,
    overview: createDemoDaoOverview(),
    lastRefreshAt: Date.now(),
    loading: false,
    error: null,
  }
}

export function selectProposal(state: GovernanceWorldState, proposalId: string): void {
  state.selectedProposalId = proposalId
}

export function selectedProposal(state: GovernanceWorldState) {
  return state.overview.proposals.find((proposal) => proposal.id === state.selectedProposalId) ?? null
}
