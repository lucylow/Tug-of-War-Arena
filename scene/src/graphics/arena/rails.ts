import { Quaternion } from '@dcl/sdk/math'

import { getRailCrossSpec, getRailSpecs } from '../../logic/graphicsLayout'
import { createBox, createRotatedBox } from '../primitives'

export function buildArenaRails(): void {
  for (const rail of getRailSpecs()) {
    createBox(rail.position, rail.scale, rail.tone, { emissive: true })
  }
  const cross = getRailCrossSpec()
  createRotatedBox(cross.position, cross.scale, Quaternion.fromEulerDegrees(0, cross.yaw, 0), cross.tone, true)
}
