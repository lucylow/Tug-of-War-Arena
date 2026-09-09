import { Entity, InputAction, pointerEventsSystem } from '@dcl/sdk/ecs'

/**
 * SDK7 pointer hover/click. Uses `pointerEventsSystem` so the hover prompt
 * and callback stay in sync (the raw PointerEvents component only describes
 * the prompt).
 */
export function setupInteraction(
  entity: Entity,
  onClick: () => void,
  hoverText: string = 'Click me!',
  maxDistance: number = 32,
): void {
  try {
    pointerEventsSystem.onPointerDown(
      {
        entity,
        opts: {
          button: InputAction.IA_POINTER,
          hoverText,
          maxDistance,
        },
      },
      onClick,
    )
  } catch (error) {
    console.log('[interaction] pointer binding failed', error)
  }
}
