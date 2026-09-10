import { createFallbackHybridWorldDataset, createHybridWorldDatasetSafe } from './generator'
import { simulationFromDataset } from './protocol'
import { assembleHybridWorld } from './renderer'
import { startHybridAmbientLoop } from './ambient'
import { SceneErrorHandler } from '../systems/errorHandling'

export { createHybridWorldDataset, createHybridWorldDatasetSafe, createFallbackHybridWorldDataset } from './generator'
export { assembleHybridWorld } from './renderer'
export { createHybridAvatar } from './renderer'
export { tickHybridSimulation } from './simulation'
export { HYBRID_WORLD_SEED } from './constants'

export function bootstrapHybridWorld(): void {
  const handler = SceneErrorHandler.getInstance()
  try {
    const dataset = createHybridWorldDatasetSafe()
    assembleHybridWorld(dataset)
    startHybridAmbientLoop({
      elapsed: 0,
      dataset,
      state: simulationFromDataset(dataset),
    })
  } catch (error) {
    handler.recordFault('Hybrid demo universe unavailable', error)
    try {
      const fallback = createFallbackHybridWorldDataset()
      assembleHybridWorld(fallback)
      startHybridAmbientLoop({
        elapsed: 0,
        dataset: fallback,
        state: simulationFromDataset(fallback),
      })
    } catch (fallbackError) {
      handler.recordFault('Hybrid mock fallback failed', fallbackError)
    }
  }
}
