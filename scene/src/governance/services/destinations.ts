import { DAO_FORUM_URL, DAO_PORTAL_URL, DAO_SNAPSHOT_URL } from '../constants'
import type { DaoProposal } from '../types'

export function resolveGovernanceUrl(proposal?: Pick<DaoProposal, 'governanceUrl'>): string {
  return proposal?.governanceUrl || DAO_PORTAL_URL
}

export function resolveForumUrl(proposal?: Pick<DaoProposal, 'discussionUrl'>): string {
  return proposal?.discussionUrl || DAO_FORUM_URL
}

export function resolveSnapshotUrl(proposal?: Pick<DaoProposal, 'snapshotUrl'>): string {
  return proposal?.snapshotUrl || DAO_SNAPSHOT_URL
}

export function isOfficialDaoHost(url: string): boolean {
  const host = url.replace(/^https?:\/\//i, '').split('/')[0]?.split('#')[0]?.toLowerCase() ?? ''
  return (
    host === 'governance.decentraland.org' ||
    host === 'forum.decentraland.org' ||
    host === 'snapshot.org' ||
    host.endsWith('.snapshot.org')
  )
}
