import { gold } from './palette'
import { box } from './entities/primitives'
import { worldLabel } from './logic/labels'
import { setupInteraction } from './systems/interaction'
import { resetWorldDemo } from './systems/reset'

const DEV = false

export function createDebugControls(applyReset: () => void): void {
  if (!DEV) return
  const pad = box(undefined, { x: 2.2, y: 0.3, z: 2.2 }, { x: 1.4, y: 0.2, z: 1.4 }, 'highlight', { collider: true })
  worldLabel({ x: 2.2, y: 0.9, z: 2.2 }, 'RESET DEMO', gold, 0.5)
  setupInteraction(pad, () => {
    resetWorldDemo(() => applyReset())
  }, 'RESET DEMO')
}
