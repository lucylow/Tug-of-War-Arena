import { Entity, Transform, engine } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

import { MODELS, SCENE } from '../config'
import { ARENA_CENTER } from '../logic/mapping'
import { border, cloud, floor, gold, midnight, moon, sun, withAlpha } from '../palette'
import { attachModelOrFallback, box, cylinder, sphere } from './primitives'

export function createArena(): Entity {
  const arena = engine.addEntity()
  Transform.create(arena, {
    position: Vector3.create(ARENA_CENTER.x, 0, ARENA_CENTER.z),
  })

  attachModelOrFallback(arena, MODELS.arena, () => {
    box(arena, { x: 0, y: -0.08, z: 0 }, { x: 28, y: 0.16, z: 22 }, floor, {
      roughness: 0.92,
      metallic: 0.04,
      collider: true,
    })

    box(arena, { x: -6.8, y: 0.02, z: 0 }, { x: 13.2, y: 0.04, z: 8.4 }, withAlpha(sun, 0.35), {
      emissive: sun,
      emissiveIntensity: 0.35,
    })
    box(arena, { x: 6.8, y: 0.02, z: 0 }, { x: 13.2, y: 0.04, z: 8.4 }, withAlpha(moon, 0.35), {
      emissive: moon,
      emissiveIntensity: 0.35,
    })

    box(arena, { x: 0, y: 0.03, z: 0 }, { x: 0.18, y: 0.04, z: 8.4 }, cloud)
    box(arena, { x: 0, y: 0.55, z: 0 }, { x: 0.55, y: 1.1, z: 0.18 }, gold, {
      emissive: gold,
      emissiveIntensity: 1.4,
    })

    const railHeight = 0.55
    box(arena, { x: 0, y: railHeight, z: -10.4 }, { x: 28, y: 1.1, z: 0.35 }, midnight, { collider: true })
    box(arena, { x: 0, y: railHeight, z: 10.4 }, { x: 28, y: 1.1, z: 0.35 }, midnight, { collider: true })
    box(arena, { x: -13.8, y: railHeight, z: 0 }, { x: 0.35, y: 1.1, z: 20.8 }, midnight, { collider: true })
    box(arena, { x: 13.8, y: railHeight, z: 0 }, { x: 0.35, y: 1.1, z: 20.8 }, midnight, { collider: true })

    const pylons = [
      { x: -12.6, z: -9.2 },
      { x: 12.6, z: -9.2 },
      { x: -12.6, z: 9.2 },
      { x: 12.6, z: 9.2 },
    ]
    for (const pylon of pylons) {
      cylinder(arena, { x: pylon.x, y: 1.4, z: pylon.z }, { x: 0.35, y: 1.4, z: 0.35 }, border, {
        metallic: 0.35,
        roughness: 0.35,
      })
      sphere(arena, { x: pylon.x, y: 2.95, z: pylon.z }, { x: 0.28, y: 0.28, z: 0.28 }, gold, {
        emissive: gold,
        emissiveIntensity: 2.4,
      })
    }

    for (const seatZ of [-8.6, 8.6]) {
      box(arena, { x: -7.5, y: 0.35, z: seatZ }, { x: 4.2, y: 0.7, z: 0.7 }, midnight)
      box(arena, { x: 7.5, y: 0.35, z: seatZ }, { x: 4.2, y: 0.7, z: 0.7 }, midnight)
    }
  })

  return arena
}

export function arenaWorldPosition() {
  return SCENE.center
}
