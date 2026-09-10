import { gold } from '../palette'
import { box } from '../entities/primitives'
import { worldLabel } from '../logic/labels'

export function createCrewBanners(): void {
  box(undefined, { x: 5, y: 3.6, z: 13.2 }, { x: 2.4, y: 1.6, z: 0.12 }, 'sun')
  worldLabel({ x: 5, y: 3.7, z: 13.3 }, 'SUN CREW\nNovaWisp', gold, 0.7)
  box(undefined, { x: 27, y: 3.6, z: 13.2 }, { x: 2.4, y: 1.6, z: 0.12 }, 'moon')
  worldLabel({ x: 27, y: 3.7, z: 13.3 }, 'MOON CREW\nPixelRally', gold, 0.7)
}

export function createScoreWall(sun: number, moon: number): ReturnType<typeof worldLabel> {
  box(undefined, { x: 16, y: 2.8, z: 13.6 }, { x: 5.2, y: 2.4, z: 0.2 }, 'arena')
  return worldLabel({ x: 16, y: 2.9, z: 13.7 }, `TODAY'S CREW SCORE\nSUN ${sun}   MOON ${moon}\nWINS  STREAK  PLAYERS`, gold, 0.8)
}
