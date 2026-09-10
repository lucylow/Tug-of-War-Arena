import { addFloat, initFloatSystem } from '../animation/float'
import { getConfettiSpecs } from '../../logic/graphicsLayout'
import { createBox } from '../primitives'

export function buildConfettiField(): void {
  initFloatSystem()
  for (const piece of getConfettiSpecs()) {
    const entity = createBox(piece.position, piece.scale, piece.tone, { emissive: true })
    addFloat(entity, piece.position, piece.amplitude ?? 0.22, piece.speed ?? 0.55, piece.phase ?? 0)
  }
}
