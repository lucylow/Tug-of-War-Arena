export interface GovernanceMetrics {
  openedDao: number
  openedForum: number
  openedProposal: number
  openedSnapshot: number
  selectedProposal: number
}

const metrics: GovernanceMetrics = {
  openedDao: 0,
  openedForum: 0,
  openedProposal: 0,
  openedSnapshot: 0,
  selectedProposal: 0,
}

export function incrementMetric(key: keyof GovernanceMetrics): void {
  metrics[key] += 1
}

export function getGovernanceMetrics(): GovernanceMetrics {
  return { ...metrics }
}

export function resetGovernanceMetrics(): void {
  metrics.openedDao = 0
  metrics.openedForum = 0
  metrics.openedProposal = 0
  metrics.openedSnapshot = 0
  metrics.selectedProposal = 0
}
