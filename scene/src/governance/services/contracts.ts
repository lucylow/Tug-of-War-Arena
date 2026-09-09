import type { DaoStage, GovernanceMode } from '../types'

export interface GovernanceSecurityPolicy {
  privateKeysInScene: false
  secretCredentialsInScene: false
  bindingVoteImplementedLocally: false
  externalLinksMustBeExplicitClicks: true
  demoDataMustBeMarked: true
}

export const GOVERNANCE_SECURITY_POLICY: GovernanceSecurityPolicy = {
  privateKeysInScene: false,
  secretCredentialsInScene: false,
  bindingVoteImplementedLocally: false,
  externalLinksMustBeExplicitClicks: true,
  demoDataMustBeMarked: true,
}

export interface LiveGovernanceApiResponse {
  mode: 'live'
  sourceUrl: string
  fetchedAt: string
  proposals: Array<{
    id: string
    title: string
    category: string
    stage: DaoStage
    summary: string
    author?: string
    createdAt: string
    endAt?: string
    yesPercent: number
    noPercent: number
    abstainPercent?: number
    participatingVP: number
    acceptanceThresholdVP: number
    governanceUrl?: string
    discussionUrl?: string
    snapshotUrl?: string
  }>
}

export function assertNoCustodialSecrets(record: Record<string, unknown>): boolean {
  const banned = ['privateKey', 'seedPhrase', 'mnemonic', 'secretKey', 'adminKey']
  return banned.every((key) => record[key] === undefined)
}

export function liveResponseMode(payload: Pick<LiveGovernanceApiResponse, 'mode'>): GovernanceMode {
  return payload.mode === 'live' ? 'live' : 'demo'
}
