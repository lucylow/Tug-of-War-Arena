import { engine } from '@dcl/sdk/ecs'
import { TARGET_UPDATE_MS } from '../config'

export function startPerformanceSystem(onTick: () => void): void {
  let elapsed = 0
  engine.addSystem((dt) => {
    elapsed += dt * 1000
    if (elapsed < TARGET_UPDATE_MS) return
    elapsed = 0
    onTick()
  })
}
