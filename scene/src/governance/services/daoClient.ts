import { createDemoDaoOverview } from '../data/overview'
import type { DaoOverview, DaoProposal, GovernanceMode } from '../types'
import { clampPercent, normalizeMetric } from './format'

export interface DaoClientConfig {
  apiUrl?: string
  mode?: GovernanceMode
}

export class DaoClient {
  private readonly apiUrl: string | undefined
  private readonly mode: GovernanceMode

  constructor(config: DaoClientConfig = {}) {
    this.apiUrl = config.apiUrl
    this.mode = config.mode ?? (config.apiUrl ? 'live' : 'demo')
  }

  async getOverview(): Promise<DaoOverview> {
    if (this.mode === 'demo' || !this.apiUrl) {
      return createDemoDaoOverview()
    }

    try {
      const response = await fetch(this.apiUrl, {
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) throw new Error(`DAO API returned ${response.status}`)
      const payload = (await response.json()) as Partial<DaoOverview>
      return normalizeOverview(payload)
    } catch (error) {
      console.log('[Friendzone DAO] live fetch failed, using demo fallback', error)
      return createDemoDaoOverview()
    }
  }
}

export function normalizeOverview(payload: Partial<DaoOverview>): DaoOverview {
  const fallback = createDemoDaoOverview()
  const mode: GovernanceMode = payload.mode === 'live' ? 'live' : 'demo'
  const source = payload.proposals?.length ? payload.proposals : fallback.proposals
  return {
    votingPowerEligibility: payload.votingPowerEligibility ?? fallback.votingPowerEligibility,
    votingPowerNote: payload.votingPowerNote ?? fallback.votingPowerNote,
    workflow: payload.workflow?.length ? payload.workflow : fallback.workflow,
    proposals: sanitizeProposals(source, mode),
    sourceUrl: payload.sourceUrl ?? fallback.sourceUrl,
    fetchedAt: payload.fetchedAt ?? new Date().toISOString(),
    mode,
  }
}

export function sanitizeProposals(items: DaoProposal[], mode: GovernanceMode = 'demo'): DaoProposal[] {
  return items.map((item) => ({
    ...item,
    yesPercent: clampPercent(item.yesPercent),
    noPercent: clampPercent(item.noPercent),
    abstainPercent: clampPercent(item.abstainPercent),
    participatingVP: normalizeMetric(item.participatingVP),
    acceptanceThresholdVP: normalizeMetric(item.acceptanceThresholdVP),
    isDemo: mode === 'demo' ? true : item.isDemo === true,
  }))
}
