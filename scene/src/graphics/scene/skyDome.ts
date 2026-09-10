import { addFloat, initFloatSystem } from '../animation/float'
import { getCloudSpecs, getSkyPanelSpecs } from '../../logic/graphicsLayout'
import { createBox, createSphere } from '../primitives'

export function buildSkyBackdrop(): void {
  for (const panel of getSkyPanelSpecs()) {
    createBox(panel.position, panel.scale, panel.tone, { emissive: panel.emissive })
  }

  initFloatSystem()
  for (const cloud of getCloudSpecs()) {
    const entity = createSphere(cloud.position, cloud.scale, cloud.tone)
    addFloat(entity, cloud.position, cloud.amplitude ?? 0.12, cloud.speed ?? 0.55, cloud.phase ?? 0)
  }
}
