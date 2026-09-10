import { getDecorativeTileSpecs } from '../../logic/graphicsLayout'
import { createBox } from '../primitives'

export function buildDecorativeTiles(): void {
  for (const tile of getDecorativeTileSpecs()) {
    createBox(tile.position, tile.scale, tile.tone, { emissive: true })
  }
}
