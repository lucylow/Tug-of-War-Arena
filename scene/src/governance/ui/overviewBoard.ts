import { Vector3 } from '@dcl/sdk/math'

import type { DaoOverview } from '../types'
import { GOVERNANCE_COLORS } from '../visual/materialFactory'
import { addGovernanceLabel, updateGovernanceLabel } from './labels'

export function createGovernanceOverviewBoard(overview: DaoOverview, position: Vector3): ReturnType<typeof addGovernanceLabel>[] {
  const lines = [
    'HOW DECENTRALAND DAO GOVERNANCE WORKS',
    overview.votingPowerEligibility.toUpperCase(),
    'POLL → DRAFT → GOVERNANCE',
    'BINDING OUTCOMES ARE HANDLED THROUGH THE OFFICIAL GOVERNANCE SYSTEM',
    overview.mode === 'demo' ? 'DEMO WORLD SURFACE • VERIFY LIVE DETAILS IN THE DAO' : 'LIVE GOVERNANCE FEED',
  ]

  return lines.map((text, index) =>
    addGovernanceLabel(
      text,
      Vector3.create(position.x, position.y - index * 0.42, position.z),
      index === 0 ? 0.72 : 0.38,
      index === 0 ? GOVERNANCE_COLORS.pink : GOVERNANCE_COLORS.white,
    ),
  )
}

export function updateGovernanceOverviewBoard(
  entities: ReturnType<typeof addGovernanceLabel>[],
  overview: DaoOverview,
): void {
  if (!entities[4]) return
  updateGovernanceLabel(
    entities[4],
    overview.mode === 'demo' ? 'DEMO WORLD SURFACE • VERIFY LIVE DETAILS IN THE DAO' : 'LIVE GOVERNANCE FEED',
  )
}
