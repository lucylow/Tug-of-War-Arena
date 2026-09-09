import type { DaoStage } from '../types'

const ORDER: DaoStage[] = ['pre-proposal', 'draft', 'governance', 'enacted']

export function stageIndex(stage: DaoStage): number {
  return Math.max(0, ORDER.indexOf(stage))
}

export function stageProgress(stage: DaoStage): number {
  const index = stageIndex(stage)
  if (stage === 'rejected') return 0
  return Math.min(1, (index + 1) / ORDER.length)
}

export function nextStage(stage: DaoStage): DaoStage | null {
  const index = ORDER.indexOf(stage)
  if (index < 0 || index + 1 >= ORDER.length) return null
  return ORDER[index + 1] ?? null
}

export function stageShortName(stage: DaoStage): string {
  switch (stage) {
    case 'pre-proposal':
      return 'POLL'
    case 'draft':
      return 'DRAFT'
    case 'governance':
      return 'GOV'
    case 'enacted':
      return 'ENACTED'
    case 'rejected':
      return 'REJECTED'
  }
}

export function stageLabel(stage: DaoStage): string {
  switch (stage) {
    case 'pre-proposal':
      return 'PRE-PROPOSAL POLL'
    case 'draft':
      return 'DRAFT PROPOSAL'
    case 'governance':
      return 'GOVERNANCE PROPOSAL'
    case 'enacted':
      return 'ENACTED'
    case 'rejected':
      return 'REJECTED'
  }
}
