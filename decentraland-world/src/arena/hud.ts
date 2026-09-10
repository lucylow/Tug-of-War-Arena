import { Entity } from '@dcl/sdk/ecs'

import { gold } from '../palette'
import { worldLabel, setLabel } from '../logic/labels'

export type MatchHud = {
  score: Entity
  timer: Entity
  round: Entity
  streak: Entity
}

export function createMatchHud(): MatchHud {
  return {
    score: worldLabel({ x: 16, y: 6.4, z: 16 }, 'SUN 428   MOON 381', gold, 1.35),
    timer: worldLabel({ x: 16, y: 5.8, z: 16 }, '00:42', gold, 1.15),
    round: worldLabel({ x: 16, y: 5.3, z: 16 }, 'ROUND 3', gold, 0.95),
    streak: worldLabel({ x: 16, y: 4.85, z: 16 }, 'STREAK 4', gold, 0.9),
  }
}

export function updateMatchHud(hud: MatchHud, input: { sun: number; moon: number; timer: string; round: number; streak: number }): void {
  setLabel(hud.score, `SUN ${input.sun}   MOON ${input.moon}`)
  setLabel(hud.timer, input.timer)
  setLabel(hud.round, `ROUND ${input.round}`)
  setLabel(hud.streak, `STREAK ${input.streak}`)
}
