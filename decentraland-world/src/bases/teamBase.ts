import { Entity } from '@dcl/sdk/ecs'

import { gold } from '../palette'
import { box, cylinder, sphere } from '../entities/primitives'
import { worldLabel } from '../logic/labels'

export function createTeamBase(options: { team: 'sun' | 'moon'; score: number; players: number }): Entity {
  const team = options.team
  const x = team === 'sun' ? 5 : 27
  const material = team === 'sun' ? 'sun' : 'moon'
  const root = box(undefined, { x, y: 0.18, z: 16 }, { x: 5.2, y: 0.36, z: 5.2 }, 'arena')
  box(root, { x: 0, y: 0.28, z: 0 }, { x: 4.6, y: 0.12, z: 4.6 }, material)
  cylinder(root, { x: 0, y: 0.08, z: 0 }, { x: 5.4, y: 0.08, z: 5.4 }, material)
  cylinder(root, { x: team === 'sun' ? -2.1 : 2.1, y: 2.2, z: 0 }, { x: 0.12, y: 4.2, z: 0.12 }, 'highlight')
  box(root, { x: team === 'sun' ? -2.1 : 2.1, y: 4.3, z: 0 }, { x: 1.6, y: 1.1, z: 0.08 }, material)
  sphere(root, { x: 0, y: 1.4, z: 0 }, { x: 0.7, y: 0.7, z: 0.7 }, material)
  box(root, { x: -1.4, y: 0.55, z: -1.6 }, { x: 0.4, y: 0.18, z: 0.4 }, 'highlight')
  box(root, { x: 1.4, y: 0.55, z: -1.6 }, { x: 0.4, y: 0.18, z: 0.4 }, 'highlight')
  worldLabel({ x, y: 2.4, z: 16 }, team === 'sun' ? 'SUN CREW' : 'MOON CREW', gold, 1.15)
  worldLabel({ x, y: 1.9, z: 16 }, `TEAM SCORE\n${options.score}`, gold, 0.95)
  worldLabel({ x, y: 1.35, z: 16 }, `Players:\n${options.players}`, gold, 0.8)
  return root
}
