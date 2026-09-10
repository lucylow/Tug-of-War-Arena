import { gold } from './palette'
import { cylinder, sphere } from './entities/primitives'
import { worldLabel } from './logic/labels'
import { setupInteraction } from './systems/interaction'

const PORTALS = [
  { id: 'mobile', title: 'MOBILE COMPANION', x: 12.4, z: 6.2, material: 'neutral' as const },
  { id: 'governance', title: 'DAO GOVERNANCE', x: 14.2, z: 6.2, material: 'glass' as const },
  { id: 'achievements', title: 'ACHIEVEMENTS', x: 16, z: 6.2, material: 'highlight' as const },
  { id: 'events', title: 'EVENTS', x: 17.8, z: 6.2, material: 'sun' as const },
  { id: 'hub', title: 'WORLD HUB', x: 19.6, z: 6.2, material: 'moon' as const },
]

export function createPortals(onOpen: (id: string) => void, reducedMotion = false): void {
  PORTALS.forEach((portal) => {
    const body = cylinder(undefined, { x: portal.x, y: 1.1, z: portal.z }, { x: 0.7, y: 2.1, z: 0.7 }, portal.material, {
      collider: true,
    })
    sphere(undefined, { x: portal.x, y: 2.4, z: portal.z }, { x: reducedMotion ? 0.35 : 0.42, y: 0.35, z: 0.35 }, 'highlight')
    worldLabel({ x: portal.x, y: 2.9, z: portal.z }, portal.title, gold, 0.5)
    setupInteraction(body, () => onOpen(portal.id), portal.title)
  })
}
