import { sphere } from '../entities/primitives'
import { registerTemporaryEntity, getTemporaryEntityCount } from './temporaryEntities'
import { MAX_PARTICLES } from '../config'

export function burst(x: number, y: number, z: number, count = 6): void {
  const n = Math.min(count, Math.max(0, MAX_PARTICLES - getTemporaryEntityCount()))
  for (let i = 0; i < n; i += 1) {
    const entity = sphere(undefined, { x: x + (i % 3) * 0.12, y: y + 0.12 * i, z }, { x: 0.08, y: 0.08, z: 0.08 }, 'highlight')
    registerTemporaryEntity(entity, 900, 'confetti')
  }
}

export function celebrate(x: number, z: number): void {
  burst(x, 1.6, z, 8)
}
