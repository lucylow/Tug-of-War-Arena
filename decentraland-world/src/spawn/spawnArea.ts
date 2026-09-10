import { COPY } from '../copy'
import { gold } from '../palette'
import { box, cylinder, sphere } from '../entities/primitives'
import { worldLabel } from '../logic/labels'

export function createSpawnSign(): void {
  box(undefined, { x: 16, y: 2.4, z: 3.4 }, { x: 6.4, y: 1.6, z: 0.28 }, 'highlight')
  worldLabel({ x: 16, y: 2.55, z: 3.6 }, COPY.welcome, gold, 1.6)
  sphere(undefined, { x: 13.2, y: 3.5, z: 3.4 }, { x: 0.55, y: 0.55, z: 0.55 }, 'sun')
  sphere(undefined, { x: 18.8, y: 3.5, z: 3.4 }, { x: 0.55, y: 0.55, z: 0.55 }, 'moon')
  cylinder(undefined, { x: 16, y: 3.5, z: 3.4 }, { x: 0.22, y: 0.9, z: 0.22 }, 'rope')
}

export function createSpawnHints(): void {
  worldLabel({ x: 16, y: 1.7, z: 5.2 }, COPY.chooseCrew, gold, 1.1)
  worldLabel({ x: 16, y: 1.25, z: 6.4 }, COPY.enterArena, gold, 1.1)
}

export function createSpawnArea(): void {
  box(undefined, { x: 16, y: 0.08, z: 4.2 }, { x: 8.4, y: 0.12, z: 4.2 }, 'neutral')
  createSpawnSign()
  createSpawnHints()
}
