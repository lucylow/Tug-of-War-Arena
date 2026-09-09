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
  maxDistance: number = 10,
): void {
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
}
