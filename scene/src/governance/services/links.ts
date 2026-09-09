import { openExternalUrl } from '~system/RestrictedActions'

import type { DaoProposal } from '../types'
import { resolveForumUrl, resolveGovernanceUrl, resolveSnapshotUrl } from './destinations'
import { incrementMetric } from './metrics'

async function open(url: string): Promise<void> {
  try {
    await openExternalUrl({ url })
  } catch (error) {
    console.log('[Friendzone DAO] external link failed', error)
  }
}

export function openDao(): void {
  incrementMetric('openedDao')
  void open(resolveGovernanceUrl())
}

export function openForum(): void {
  incrementMetric('openedForum')
  void open(resolveForumUrl())
}

export function openProposal(proposal: DaoProposal): void {
  incrementMetric('openedProposal')
  void open(resolveGovernanceUrl(proposal))
}

export function openDiscussion(proposal: DaoProposal): void {
  incrementMetric('openedForum')
  void open(resolveForumUrl(proposal))
}

export function openSnapshot(proposal: DaoProposal): void {
  incrementMetric('openedSnapshot')
  void open(resolveSnapshotUrl(proposal))
}
