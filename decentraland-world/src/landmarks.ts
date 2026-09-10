import { gold, governance } from './palette'
import { box, cylinder, sphere } from './entities/primitives'
import { worldLabel } from './logic/labels'

export function createLandmarks(): void {
  worldLabel({ x: 16, y: 4.2, z: 3.2 }, 'FRIENDZONE SIGN', gold, 1.05)
  box(undefined, { x: 16, y: 3.1, z: 10.2 }, { x: 5.6, y: 4.2, z: 0.5 }, 'arena')
  cylinder(undefined, { x: 13.4, y: 2.2, z: 10.2 }, { x: 0.45, y: 4.4, z: 0.45 }, 'highlight')
  cylinder(undefined, { x: 18.6, y: 2.2, z: 10.2 }, { x: 0.45, y: 4.4, z: 0.45 }, 'highlight')
  worldLabel({ x: 16, y: 5.4, z: 10.2 }, 'ARENA ARCH', gold, 1.1)

  cylinder(undefined, { x: 4.2, y: 4.6, z: 8 }, { x: 0.7, y: 8.8, z: 0.7 }, 'sun')
  sphere(undefined, { x: 4.2, y: 9.3, z: 8 }, { x: 1.1, y: 1.1, z: 1.1 }, 'sun')
  worldLabel({ x: 4.2, y: 10.6, z: 8 }, 'SUN TOWER', gold, 0.9)

  cylinder(undefined, { x: 27.8, y: 4.6, z: 8 }, { x: 0.85, y: 8.8, z: 0.85 }, 'moon')
  box(undefined, { x: 27.8, y: 9.2, z: 8 }, { x: 1.4, y: 1.4, z: 1.4 }, 'moon')
  worldLabel({ x: 27.8, y: 10.6, z: 8 }, 'MOON TOWER', gold, 0.9)

  cylinder(undefined, { x: 8, y: 1.6, z: 26 }, { x: 1.4, y: 3.2, z: 1.4 }, 'neutral')
  worldLabel({ x: 8, y: 3.6, z: 26 }, 'EVENT PORTAL', gold, 0.95)

  box(undefined, { x: 24, y: 1.4, z: 26 }, { x: 3.2, y: 2.6, z: 3.2 }, 'glass')
  worldLabel({ x: 24, y: 3.2, z: 26 }, 'GOVERNANCE PLAZA', governance, 0.9)

  sphere(undefined, { x: 16, y: 2.2, z: 29.2 }, { x: 1.6, y: 1.6, z: 1.6 }, 'highlight')
  worldLabel({ x: 16, y: 4.1, z: 29.2 }, 'ACHIEVEMENT PLAZA', gold, 0.9)
}
