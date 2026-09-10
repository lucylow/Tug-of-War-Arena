import { Quaternion } from '@dcl/sdk/math'

import { getStageMarkerSpecs, getStageSpecs } from '../../logic/graphicsLayout'
import { createBox, createRotatedBox } from '../primitives'

export function buildArenaStage(): void {
  for (const piece of getStageSpecs()) {
    createBox(piece.position, piece.scale, piece.tone, { emissive: piece.emissive })
  }
  for (const marker of getStageMarkerSpecs()) {
    createRotatedBox(
      marker.position,
      marker.scale,
      Quaternion.fromEulerDegrees(0, marker.yaw, 0),
      marker.tone,
      true,
    )
  }
}
