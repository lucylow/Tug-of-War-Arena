import { Quaternion } from '@dcl/sdk/math'

import { addPulse, initPulseSystem } from '../animation/pulses'
import { getPortalFrameSpecs } from '../../logic/graphicsLayout'
import { createRotatedBox, createSphere } from '../primitives'

export function buildPortalFrames(): void {
  initPulseSystem()
  for (const portal of getPortalFrameSpecs()) {
    for (const post of portal.posts) {
      createRotatedBox(
        post.position,
        post.scale,
        Quaternion.fromEulerDegrees(0, 0, post.roll),
        post.tone,
        true,
      )
    }
    createRotatedBox(portal.beam.position, portal.beam.scale, Quaternion.fromEulerDegrees(0, 0, 0), portal.beam.tone, true)
    const core = createSphere(portal.core.position, portal.core.scale, portal.core.tone, true)
    addPulse(core, portal.core.scale, portal.core.speed ?? 1.5, portal.core.amount ?? 0.07, portal.core.phase ?? 0)
  }
}
