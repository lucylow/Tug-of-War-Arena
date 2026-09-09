import type { GovernanceFeatureContract } from './types'

export const DAO_PORTAL_URL = 'https://governance.decentraland.org/'
export const DAO_FORUM_URL = 'https://forum.decentraland.org/'
export const DAO_SNAPSHOT_URL = 'https://snapshot.org/#/snapshot.dao.decentraland.eth'

export const DAO_WORKFLOW = {
  preProposal: {
    label: 'PRE-PROPOSAL POLL',
    thresholdVP: 500_000,
    duration: '5 days',
    goal: 'Gauge community sentiment and build support for an issue.',
  },
  draft: {
    label: 'DRAFT PROPOSAL',
    thresholdVP: 1_000_000,
    duration: '1 week',
    goal: 'Formalize the policy, impact, and implementation path.',
  },
  governance: {
    label: 'GOVERNANCE PROPOSAL',
    thresholdVP: 6_000_000,
    duration: '2 weeks',
    goal: 'Request a binding governance outcome.',
  },
} as const

export const DAO_VOTING_POWER_TEXT =
  'Decentraland DAO participation is associated with MANA, LAND, or NAME ownership and proposal-specific Voting Power.'

export const DAO_SOURCE_NOTE =
  'This World surface is an educational/discovery layer. Binding votes remain in the official Decentraland governance interface.'

export const DEFAULT_GOVERNANCE_CONTRACT: GovernanceFeatureContract = {
  mode: 'demo',
  allowExternalDaoLinks: true,
  showDemoLabels: true,
  neverCastBindingVoteFromScene: true,
}

export const JUDGE_FLOW = [
  'ENTER_WORLD',
  'PLAY_ARENA',
  'DISCOVER_GOVERNANCE_PLAZA',
  'READ_WORKFLOW',
  'EXPLORE_PROPOSAL',
  'OPEN_OFFICIAL_DAO',
  'RETURN_TO_WORLD',
] as const

export const GOVERNANCE_LAYOUT = {
  plazaOffsetZ: 5.6,
  workflowBoardOffsetZ: 7.15,
  terminalOffsetX: 6.4,
  voteGuideOffsetX: -6.4,
  badgesOffsetZ: 4.05,
  overviewOffsetY: 4.85,
  playerApproach: 'from-arena',
} as const
