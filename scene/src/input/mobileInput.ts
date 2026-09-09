import { engine, InputAction, PointerEventType, inputSystem } from '@dcl/sdk/ecs'

import { queueTap, restartMatch } from '../systems/session'

/**
 * Explorer on-screen controls map to the same InputAction enum as desktop.
 * Do not bind key actions to IA_ACTION_3–IA_ACTION_6 (1/2/3/4 keys).
 *
 * @see https://docs.decentraland.org/creator/build-for-mobile/develop/input-on-mobile
 */
export const MobileInputMap = {
  TAP: InputAction.IA_POINTER,
  PRIMARY_ACTION: InputAction.IA_PRIMARY,
  SECONDARY_ACTION: InputAction.IA_SECONDARY,
  JUMP: InputAction.IA_JUMP,
} as const

const BLOCKED: InputAction[] = [
  InputAction.IA_ACTION_3,
  InputAction.IA_ACTION_4,
  InputAction.IA_ACTION_5,
  InputAction.IA_ACTION_6,
]

export function isMobileFriendlyAction(action: InputAction): boolean {
  return !BLOCKED.includes(action)
}

/**
 * E / primary = extra pull (same as the interaction button).
 * F / secondary = rematch. Jump is left for locomotion.
 */
export function setupMobileInput(): void {
  engine.addSystem(function mobileInputSystem() {
    if (inputSystem.isTriggered(MobileInputMap.PRIMARY_ACTION, PointerEventType.PET_DOWN)) {
      queueTap(1)
    }
    if (inputSystem.isTriggered(MobileInputMap.SECONDARY_ACTION, PointerEventType.PET_DOWN)) {
      restartMatch()
    }
  })
}

export function setupExplorerInput(): void {
  setupMobileInput()
}
