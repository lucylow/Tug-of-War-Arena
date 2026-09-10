import { gold } from '../palette'
import { worldLabel, setLabel } from '../logic/labels'
import type { Entity } from '@dcl/sdk/ecs'

export function createFinishBanner(): Entity {
  return worldLabel({ x: 16, y: 4.2, z: 18.2 }, '', gold, 1.4)
}

export function showFinish(
  banner: Entity,
  winner: 'sun' | 'moon',
  stats: { pulls: number; streak: number; personalBest: boolean },
): void {
  const extra = stats.personalBest ? '\nPERSONAL BEST' : ''
  setLabel(banner, `${winner === 'sun' ? 'SUN CREW WINS!' : 'MOON CREW WINS!'}\nPULLS ${stats.pulls}\nSTREAK ${stats.streak}${extra}`)
}

export function hideFinish(banner: Entity): void {
  setLabel(banner, '')
}
