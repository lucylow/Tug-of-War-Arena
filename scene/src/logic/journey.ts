import { ARENA_CENTER, type CrewId, type Vec3 } from './mapping'

import { GOVERNANCE_LAYOUT } from '../governance/constants'

/**
 * Physical walk: entrance → crew choice → arena → match pads → governance plaza → social board → portals.
 * Positions stay inside the 2×2 parcel (0–32) and clear of the rope.
 */
export const ENTRANCE_GATE_WIDTH = 5.2

export function getEntrancePosition(): Vec3 {
  return { x: ARENA_CENTER.x, y: 0, z: ARENA_CENTER.z - 12.4 }
}

export function getCrewChoicePosition(crew: CrewId): Vec3 {
  const offset = crew === 'sun' ? -2.4 : 2.4
  return { x: ARENA_CENTER.x + offset, y: 0.12, z: ARENA_CENTER.z - 11.2 }
}

export function getCrewBasePosition(crew: CrewId): Vec3 {
  const x = crew === 'sun' ? ARENA_CENTER.x - 11.4 : ARENA_CENTER.x + 11.4
  return { x, y: 0, z: ARENA_CENTER.z }
}

export function getPullPadPosition(): Vec3 {
  return { x: ARENA_CENTER.x, y: 0.12, z: ARENA_CENTER.z - 7.2 }
}

export function getRematchPadPosition(): Vec3 {
  return { x: ARENA_CENTER.x + 3.4, y: 0.12, z: ARENA_CENTER.z - 7.2 }
}

export function getCrewBoardPosition(): Vec3 {
  return { x: ARENA_CENTER.x, y: 0, z: ARENA_CENTER.z + 12.2 }
}

export function getPortalPosition(kind: 'crew' | 'mobile'): Vec3 {
  const x = kind === 'crew' ? ARENA_CENTER.x - 4.6 : ARENA_CENTER.x + 4.6
  return { x, y: 0, z: ARENA_CENTER.z + 13.6 }
}

export function getGovernancePlazaPosition(): Vec3 {
  return { x: ARENA_CENTER.x, y: 0, z: ARENA_CENTER.z + GOVERNANCE_LAYOUT.plazaOffsetZ }
}

export function getGovernanceWorkflowBoardPosition(): Vec3 {
  return {
    x: ARENA_CENTER.x,
    y: 2.55,
    z: ARENA_CENTER.z + GOVERNANCE_LAYOUT.workflowBoardOffsetZ,
  }
}

export function getGovernanceTerminalPosition(): Vec3 {
  return {
    x: ARENA_CENTER.x + GOVERNANCE_LAYOUT.terminalOffsetX,
    y: 0.92,
    z: ARENA_CENTER.z + GOVERNANCE_LAYOUT.plazaOffsetZ,
  }
}

export function getGovernanceVoteGuidePosition(): Vec3 {
  return {
    x: ARENA_CENTER.x + GOVERNANCE_LAYOUT.voteGuideOffsetX,
    y: 2.15,
    z: ARENA_CENTER.z + GOVERNANCE_LAYOUT.plazaOffsetZ,
  }
}

export function getGovernanceBadgesPosition(): Vec3 {
  return {
    x: ARENA_CENTER.x,
    y: 0.52,
    z: ARENA_CENTER.z + GOVERNANCE_LAYOUT.badgesOffsetZ,
  }
}

export function getGovernanceOverviewPosition(): Vec3 {
  return {
    x: ARENA_CENTER.x,
    y: GOVERNANCE_LAYOUT.overviewOffsetY,
    z: ARENA_CENTER.z + GOVERNANCE_LAYOUT.plazaOffsetZ,
  }
}

export function getProposalPedestalPosition(index: number): Vec3 {
  const slot = Math.max(0, Math.min(2, Math.floor(index)))
  return {
    x: ARENA_CENTER.x + (slot - 1) * 3.7,
    y: 0.75,
    z: ARENA_CENTER.z + GOVERNANCE_LAYOUT.plazaOffsetZ,
  }
}

export function getAmbientCloudOrigin(index: number): Vec3 {
  const slot = ((index % 4) + 4) % 4
  const x = ARENA_CENTER.x + (slot % 2 === 0 ? -6 : 6)
  const z = ARENA_CENTER.z + (slot < 2 ? -5 : 5)
  return { x, y: 7.4 + slot * 0.35, z }
}

export function getAmbientSparkleOrigin(index: number): Vec3 {
  const slot = ((index % 8) + 8) % 8
  const angle = (slot / 8) * Math.PI * 2
  return {
    x: ARENA_CENTER.x + Math.cos(angle) * 5.5,
    y: 2.4 + (slot % 3) * 0.4,
    z: ARENA_CENTER.z + Math.sin(angle) * 3.4,
  }
}

export function isInsideParcel(point: Vec3, size: number = 32): boolean {
  return point.x >= 0 && point.x <= size && point.z >= 0 && point.z <= size && point.y >= 0
}
