import { COPY } from '../copy'
import { gold } from '../palette'
import { box, cylinder, sphere } from '../entities/primitives'
import { worldLabel } from '../logic/labels'
import { setupInteraction } from '../systems/interaction'

export function createArenaEntrance(onEnter: () => void): void {
  cylinder(undefined, { x: 13.2, y: 2.4, z: 11.4 }, { x: 0.42, y: 4.8, z: 0.42 }, 'highlight', { collider: true })
  cylinder(undefined, { x: 18.8, y: 2.4, z: 11.4 }, { x: 0.42, y: 4.8, z: 0.42 }, 'highlight', { collider: true })
  box(undefined, { x: 16, y: 4.8, z: 11.4 }, { x: 6.2, y: 0.45, z: 0.45 }, 'arena')
  cylinder(undefined, { x: 14.2, y: 3.2, z: 11.4 }, { x: 0.08, y: 0.08, z: 2.2 }, 'rope')
  cylinder(undefined, { x: 17.8, y: 3.2, z: 11.4 }, { x: 0.08, y: 0.08, z: 2.2 }, 'rope')
  sphere(undefined, { x: 16, y: 3.6, z: 11.4 }, { x: 0.55, y: 0.55, z: 0.55 }, 'highlight')
  box(undefined, { x: 13.2, y: 3.6, z: 11.1 }, { x: 0.08, y: 1.6, z: 0.9 }, 'sun')
  box(undefined, { x: 18.8, y: 3.6, z: 11.1 }, { x: 0.08, y: 1.6, z: 0.9 }, 'moon')
  box(undefined, { x: 16, y: 0.12, z: 12.6 }, { x: 1.2, y: 0.08, z: 1.6 }, 'highlight')
  const pad = box(undefined, { x: 16, y: 0.16, z: 11.6 }, { x: 3.6, y: 0.18, z: 1.6 }, 'highlight', { collider: true })
  worldLabel({ x: 16, y: 5.4, z: 11.4 }, COPY.enterArena, gold, 1.3)
  setupInteraction(pad, onEnter, COPY.enterArena)
}
