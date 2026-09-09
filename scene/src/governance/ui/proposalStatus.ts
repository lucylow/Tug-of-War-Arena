import { Vector3 } from '@dcl/sdk/math'

import type { DaoProposal } from '../types'
import { formatPercent, formatVp } from '../services/format'
import { stageShortName } from '../services/workflow'
import { GOVERNANCE_COLORS } from '../visual/materialFactory'
import { addGovernanceLabel } from './labels'

export function createProposalStatus(proposal: DaoProposal, position: Vector3): void {
  const lines = [
    `${stageShortName(proposal.stage)} • ${proposal.category.toUpperCase()}`,
    proposal.title,
    `YES ${formatPercent(proposal.yesPercent)}  •  NO ${formatPercent(proposal.noPercent)}`,
    `${formatVp(proposal.participatingVP)} PARTICIPATING`,
    proposal.isDemo ? 'DEMO DATA • VERIFY IN OFFICIAL DAO' : 'LIVE DATA',
  ]

  lines.forEach((line, index) => {
    addGovernanceLabel(
      line,
      Vector3.create(position.x, position.y - index * 0.32, position.z),
      index === 1 ? 0.38 : 0.28,
      index === 0 ? GOVERNANCE_COLORS.pink : index === 4 ? GOVERNANCE_COLORS.sun : GOVERNANCE_COLORS.white,
    )
  })
}
