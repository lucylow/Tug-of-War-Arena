import { createHybridWorldDataset } from './generator'
import { simulationFromDataset } from './protocol'
import { assembleHybridWorld } from './renderer'
import { startHybridAmbientLoop } from './ambient'

export { createHybridWorldDataset } from './generator'
export { assembleHybridWorld } from './renderer'
export { createHybridAvatar } from './renderer'
export { tickHybridSimulation } from './simulation'
export { HYBRID_WORLD_SEED } from './constants'

export function bootstrapHybridWorld(): void {
  const dataset = createHybridWorldDataset()
  assembleHybridWorld(dataset)
  startHybridAmbientLoop({
    elapsed: 0,
    dataset,
    state: simulationFromDataset(dataset),
  })
}
