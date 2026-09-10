import { InputAction, pointerEventsSystem, type Entity } from '@dcl/sdk/ecs'

export function onPointer(entity: Entity, hoverText: string, onClick: () => void, maxDistance = 16): void {
  setupInteraction(entity, onClick, hoverText, maxDistance)
}

export function setupInteraction(entity: Entity, onClick: () => void, hoverText: string, maxDistance = 16): void {
  try {
    pointerEventsSystem.onPointerDown(
      { entity, opts: { button: InputAction.IA_POINTER, hoverText, maxDistance } },
      () => {
        try {
          onClick()
        } catch (error) {
          const message = error instanceof Error ? error.message : 'unknown'
          console.error(`[world] interaction failed: ${message}`)
        }
      },
    )
  } catch {
    // Pointer APIs can be unavailable in some preview hosts.
  }
}
