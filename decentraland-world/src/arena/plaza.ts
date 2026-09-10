import { Vector3 } from '@dcl/sdk/math'

import { box } from '../entities/primitives'
import { worldLabel } from '../ui/labels'

export function createCrewBases(): void {
  box(undefined, { x: 5.2, y: 0.7, z: 16 }, { x: 5.4, y: 1.4, z: 5.4 }, 'sun', { collider: true })
  worldLabel('SUN CREW', Vector3.create(5.2, 2.4, 16), 1.3)
  box(undefined, { x: 26.8, y: 0.7, z: 16 }, { x: 5.4, y: 1.4, z: 5.4 }, 'moon', { collider: true })
  worldLabel('MOON CREW', Vector3.create(26.8, 2.4, 16), 1.3)
}

export function createSpawnPlaza(): void {
  box(undefined, { x: 16, y: 0.05, z: 4.6 }, { x: 10, y: 0.1, z: 6 }, 'neutral', { collider: true })
  worldLabel('SPAWN PLAZA', Vector3.create(16, 2.6, 4.2), 1.5)
  worldLabel('FRIENDZONE', Vector3.create(16, 3.4, 4.2), 1.8)
}

export function createPortals(): void {
  box(undefined, { x: 4.5, y: 1.4, z: 4.8 }, { x: 1.4, y: 2.8, z: 0.4 }, 'glass', { collider: true })
  box(undefined, { x: 27.5, y: 1.4, z: 4.8 }, { x: 1.4, y: 2.8, z: 0.4 }, 'glass', { collider: true })
  worldLabel('WORLD PORTAL', Vector3.create(4.5, 3.2, 4.8), 0.9)
  worldLabel('WORLD PORTAL', Vector3.create(27.5, 3.2, 4.8), 0.9)
}
