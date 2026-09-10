import { gold } from '../palette'
import { box, cylinder, sphere } from '../entities/primitives'
import { worldLabel } from '../logic/labels'
import { setupInteraction } from '../systems/interaction'

export function createAchievementPlaza(onView: () => void): void {
  worldLabel({ x: 16, y: 4.6, z: 29.2 }, 'YOUR ACHIEVEMENTS', gold, 1)
  const badges = ['HOT STREAK', 'CREW PLAYER', 'ARENA VETERAN', 'MATCH PROOF']
  badges.forEach((badge, index) => {
    const x = 13.4 + index * 1.7
    cylinder(undefined, { x, y: 0.7, z: 29.2 }, { x: 0.45, y: 1.2, z: 0.45 }, 'highlight')
    sphere(undefined, { x, y: 1.7, z: 29.2 }, { x: 0.45, y: 0.45, z: 0.45 }, 'highlight')
    worldLabel({ x, y: 2.3, z: 29.2 }, badge, gold, 0.5)
  })
  box(undefined, { x: 16, y: 1.2, z: 30.4 }, { x: 0.7, y: 1.8, z: 0.7 }, 'highlight')
  box(undefined, { x: 17.2, y: 1.0, z: 30.4 }, { x: 0.6, y: 1.4, z: 0.5 }, 'arena')
  box(undefined, { x: 14.8, y: 1.0, z: 30.4 }, { x: 0.6, y: 1.4, z: 0.5 }, 'arena')
  const terminal = box(undefined, { x: 16, y: 1.1, z: 27.8 }, { x: 2.4, y: 1.6, z: 0.28 }, 'arena', { collider: true })
  worldLabel({ x: 16, y: 2.3, z: 27.8 }, 'WEB3 STATUS\nWallet: DEMO\nNetwork: Unavailable\nProof: DEMO', gold, 0.55)
  setupInteraction(terminal, onView, 'VIEW ACHIEVEMENTS')
}
