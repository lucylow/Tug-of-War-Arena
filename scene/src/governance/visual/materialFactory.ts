import type { Entity } from '@dcl/sdk/ecs'
import type { Color4 } from '@dcl/sdk/math'

import { pbrMaterial } from '../../entities/primitives'
import { cloud, gold, midnight, mint, moon, sun } from '../../palette'

export const GOVERNANCE_COLORS = {
  pink: sun,
  purple: moon,
  sun: gold,
  white: cloud,
  panel: midnight,
  green: mint,
} as const

export function paint(entity: Entity, color: Color4, extras?: { emissive?: Color4; emissiveIntensity?: number }): void {
  pbrMaterial(entity, color, {
    metallic: 0.15,
    roughness: 0.45,
    meshKey: 'box',
    emissive: extras?.emissive,
    emissiveIntensity: extras?.emissiveIntensity,
  })
}

export function stageColor(stage: string): Color4 {
  if (stage === 'governance' || stage === 'enacted') return GOVERNANCE_COLORS.sun
  if (stage === 'draft') return GOVERNANCE_COLORS.purple
  return GOVERNANCE_COLORS.pink
}
