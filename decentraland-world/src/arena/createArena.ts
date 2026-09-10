import { Vector3 } from '@dcl/sdk/math'
import { ARENA_CENTER, COLOR, MOON_BASE, SUN_BASE } from '../config'
import { box, cylinder } from '../ui/primitives'
import { worldLabel } from '../ui/labels'

export function createArena(): void {
  box(Vector3.create(ARENA_CENTER.x, 0.02, ARENA_CENTER.z), Vector3.create(18, 0.08, 10), COLOR.floor, true)
  box(Vector3.create(ARENA_CENTER.x, 0.08, ARENA_CENTER.z), Vector3.create(14, 0.12, 6), { r: 0.16, g: 0.18, b: 0.34, a: 1 }, true)
  box(Vector3.create(ARENA_CENTER.x, 0.16, ARENA_CENTER.z), Vector3.create(0.18, 0.04, 6), COLOR.cloud)
  box(Vector3.create(SUN_BASE.x + 4.2, 0.12, ARENA_CENTER.z), Vector3.create(2.4, 0.08, 6), COLOR.sun)
  box(Vector3.create(MOON_BASE.x - 4.2, 0.12, ARENA_CENTER.z), Vector3.create(2.4, 0.08, 6), COLOR.moon)

  const pillars = [
    { x: 9.2, z: 11.4 },
    { x: 22.8, z: 11.4 },
    { x: 9.2, z: 20.6 },
    { x: 22.8, z: 20.6 },
  ]
  for (const pillar of pillars) {
    cylinder(Vector3.create(pillar.x, 1.1, pillar.z), Vector3.create(0.45, 2.2, 0.45), COLOR.gold, true)
  }

  box(Vector3.create(ARENA_CENTER.x, 0.4, 11.1), Vector3.create(18, 0.8, 0.28), COLOR.midnight, true)
  box(Vector3.create(ARENA_CENTER.x, 0.4, 20.9), Vector3.create(18, 0.8, 0.28), COLOR.midnight, true)
  worldLabel('TUG OF WAR ARENA', Vector3.create(ARENA_CENTER.x, 3.2, ARENA_CENTER.z - 4.6), 1.8)
}
