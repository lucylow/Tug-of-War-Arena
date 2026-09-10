import { COPY } from '../copy'
import { gold } from '../palette'
import { box } from '../entities/primitives'
import { worldLabel } from '../logic/labels'

const ROWS = [
  '#1 NovaWisp',
  '#2 PixelRally',
  '#3 MoonRunner',
  '#4 SunSpark',
  '#5 RopeWizard',
  '#6 Lumen',
  '#7 Nyx',
  '#8 YOU',
]

export function createLeaderboard(demo = true): void {
  box(undefined, { x: 10.4, y: 1.8, z: 21.2 }, { x: 3.4, y: 3.2, z: 0.24 }, 'arena')
  worldLabel({ x: 10.4, y: 3.6, z: 21.3 }, demo ? COPY.demoLeaderboard : 'LEADERBOARD', gold, 0.85)
  ROWS.forEach((row, index) => {
    worldLabel({ x: 10.4, y: 3.15 - index * 0.28, z: 21.3 }, row, gold, 0.62)
  })
  box(undefined, { x: 9.2, y: 0.4, z: 20.4 }, { x: 0.8, y: 0.8, z: 0.8 }, 'highlight')
  box(undefined, { x: 10.4, y: 0.3, z: 20.4 }, { x: 0.7, y: 0.6, z: 0.7 }, 'sun')
  box(undefined, { x: 11.6, y: 0.22, z: 20.4 }, { x: 0.6, y: 0.44, z: 0.7 }, 'moon')
}
