import { Transform, engine } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'

import { MAX_STARS } from '../config'
import { sphere } from '../entities/primitives'

export function createAtmosphere(highGraphics: boolean): { tick: (slow: boolean) => void; dispose: () => void } {
  const clouds = [
    sphere(undefined, { x: 8, y: 12, z: 10 }, { x: 3.2, y: 0.7, z: 1.8 }, 'glass'),
    sphere(undefined, { x: 22, y: 13, z: 20 }, { x: 2.6, y: 0.6, z: 1.6 }, 'glass'),
    sphere(undefined, { x: 16, y: 14, z: 8 }, { x: 2.2, y: 0.5, z: 1.4 }, 'glass'),
  ]
  const stars = highGraphics
    ? Array.from({ length: MAX_STARS }, (_, i) =>
        sphere(undefined, { x: 2 + (i % 8) * 3.5, y: 16 + (i % 5), z: 4 + Math.floor(i / 8) * 6 }, { x: 0.08, y: 0.08, z: 0.08 }, 'highlight'),
      )
    : []

  let acc = 0
  return {
    tick(slow: boolean) {
      if (slow) return
      acc += 1
      if (acc % 8 !== 0) return
      clouds.forEach((cloud, index) => {
        const transform = Transform.getMutable(cloud)
        transform.position = Vector3.create(8 + ((acc + index * 12) % 24), transform.position.y, transform.position.z)
      })
    },
    dispose() {
      ;[...clouds, ...stars].forEach((entity) => {
        try {
          engine.removeEntity(entity)
        } catch {
          // Ignore.
        }
      })
    },
  }
}
