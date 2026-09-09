import { createHybridWorldDataset } from './generator'
import { simulationFromDataset } from './protocol'
import { assembleHybridWorld } from './renderer'
import { startHybridAmbientLoop } from './ambient'
import { SceneErrorHandler } from '../systems/errorHandling'

export { createHybridWorldDataset } from './generator'
export { assembleHybridWorld } from './renderer'
export { createHybridAvatar } from './renderer'
export { tickHybridSimulation } from './simulation'
export { HYBRID_WORLD_SEED } from './constants'

export function bootstrapHybridWorld(): void {
  try {
    const dataset = createHybridWorldDataset()
    assembleHybridWorld(dataset)
    startHybridAmbientLoop({
      elapsed: 0,
      dataset,
      state: simulationFromDataset(dataset),
    })
  } catch (error) {
    SceneErrorHandler.getInstance().recordFault('Hybrid demo universe unavailable', error)
  }
}
