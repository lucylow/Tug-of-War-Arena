import { Vector3 } from '@dcl/sdk/math'

import { formatVp } from '../services/format'
import type { DaoProposal } from '../types'
import { GOVERNANCE_COLORS } from '../visual/materialFactory'
import { addGovernanceLabel } from './labels'

export function createProposalMetrics(proposal: DaoProposal, position: Vector3): void {
  const lines = [
    `YES ${proposal.yesPercent}%`,
    `NO ${proposal.noPercent}%`,
    `ABSTAIN ${proposal.abstainPercent}%`,
    `PARTICIPATING ${formatVp(proposal.participatingVP)}`,
    `THRESHOLD ${formatVp(proposal.acceptanceThresholdVP)}`,
  ]

  lines.forEach((line, index) => {
    addGovernanceLabel(
      line,
      Vector3.create(position.x, position.y - index * 0.3, position.z),
      0.28,
      index === 0 ? GOVERNANCE_COLORS.green : GOVERNANCE_COLORS.white,
    )
  })
}
