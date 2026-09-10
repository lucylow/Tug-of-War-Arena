import { clearTemporaryEntities } from './temporaryEntities'
import { resetInputLimiter } from '../arena/inputLimiter'
import { createInitialState, type WorldRuntimeState } from '../state'

export function resetWorldDemo(apply: (state: WorldRuntimeState) => void): void {
  clearTemporaryEntities()
  resetInputLimiter()
  apply(createInitialState())
}
