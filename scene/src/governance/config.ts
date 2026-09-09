import { DAO_FORUM_URL, DAO_PORTAL_URL } from './constants'
import type { GovernanceMode } from './types'

export interface GovernanceConfig {
  mode: GovernanceMode
  apiUrl?: string
  officialGovernanceUrl: string
  officialForumUrl: string
}

export const governanceConfig: GovernanceConfig = {
  mode: 'demo',
  officialGovernanceUrl: DAO_PORTAL_URL,
  officialForumUrl: DAO_FORUM_URL,
}
