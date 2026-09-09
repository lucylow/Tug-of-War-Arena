export type GovernanceMode = 'demo' | 'live'

export type DaoStage = 'pre-proposal' | 'draft' | 'governance' | 'enacted' | 'rejected'

export type DaoProposalCategory =
  | 'governance'
  | 'grant'
  | 'poi'
  | 'catalyst'
  | 'name-ban'
  | 'community-poll'

export type DaoVoteChoice = 'yes' | 'no' | 'abstain'

export interface DaoProposal {
  id: string
  title: string
  category: DaoProposalCategory
  stage: DaoStage
  summary: string
  author: string
  createdAt: string
  endAt?: string
  yesPercent: number
  noPercent: number
  abstainPercent: number
  participatingVP: number
  acceptanceThresholdVP: number
  discussionUrl?: string
  governanceUrl?: string
  snapshotUrl?: string
  isDemo: boolean
}

export interface DaoWorkflowStep {
  stage: DaoStage
  label: string
  goal: string
  thresholdVP: number
  duration: string
}

export interface DaoOverview {
  votingPowerEligibility: string
  votingPowerNote: string
  workflow: DaoWorkflowStep[]
  proposals: DaoProposal[]
  sourceUrl: string
  fetchedAt: string
  mode: GovernanceMode
}

export interface GovernanceWorldState {
  selectedProposalId: string | null
  overview: DaoOverview
  lastRefreshAt: number
  loading: boolean
  error: string | null
}

export interface DaoInteraction {
  kind: 'open-governance' | 'open-forum' | 'open-snapshot' | 'refresh' | 'select-proposal'
  proposalId?: string
  at: number
}

export interface GovernanceFeatureContract {
  mode: GovernanceMode
  allowExternalDaoLinks: boolean
  showDemoLabels: boolean
  neverCastBindingVoteFromScene: boolean
}
