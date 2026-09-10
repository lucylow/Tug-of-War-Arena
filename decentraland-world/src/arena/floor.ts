import { box } from '../entities/primitives'

export function createArenaFloor(): void {
  box(undefined, { x: 16, y: 0.04, z: 16 }, { x: 14, y: 0.08, z: 8.4 }, 'arena')
  box(undefined, { x: 16, y: 0.1, z: 16 }, { x: 6.2, y: 0.1, z: 4.6 }, 'neutral')
  box(undefined, { x: 11.2, y: 0.11, z: 16 }, { x: 3.6, y: 0.08, z: 7.2 }, 'sun')
  box(undefined, { x: 20.8, y: 0.11, z: 16 }, { x: 3.6, y: 0.08, z: 7.2 }, 'moon')
  box(undefined, { x: 9.2, y: 0.42, z: 12.2 }, { x: 0.18, y: 0.7, z: 7.6 }, 'highlight')
  box(undefined, { x: 22.8, y: 0.42, z: 12.2 }, { x: 0.18, y: 0.7, z: 7.6 }, 'highlight')
  box(undefined, { x: 16, y: 0.12, z: 12.4 }, { x: 1.1, y: 0.08, z: 0.7 }, 'highlight')
  box(undefined, { x: 14.2, y: 0.12, z: 14.2 }, { x: 1.4, y: 0.06, z: 1.4 }, 'arena')
  box(undefined, { x: 17.8, y: 0.12, z: 14.2 }, { x: 1.4, y: 0.06, z: 1.4 }, 'arena')
}
