import { gold } from '../palette'
import { worldLabel } from '../logic/labels'
import { registerTemporaryEntity } from '../systems/temporaryEntities'
import { burst } from '../systems/particles'
import { playOptional } from '../systems/audio'

export function celebrateWin(x: number, z: number): void {
  const label = worldLabel({ x, y: 2.6, z }, 'YOU WON', gold, 1.1)
  registerTemporaryEntity(label, 2200, 'label')
  burst(x, 2.2, z, 8)
  playOptional('victory')
}

export function celebrateMission(title: string): void {
  const label = worldLabel({ x: 21.6, y: 3.8, z: 21.3 }, `${title}\nUNLOCKED`, gold, 0.9)
  registerTemporaryEntity(label, 2400, 'label')
  burst(21.6, 2.4, 21.3, 6)
}

export function celebrateAchievement(name: string): void {
  const label = worldLabel({ x: 16, y: 5.2, z: 29.2 }, name, gold, 0.9)
  registerTemporaryEntity(label, 2400, 'label')
}

export function celebrateCrewJoin(name: string): void {
  const label = worldLabel({ x: 16, y: 2.8, z: 4.4 }, `${name} joined`, gold, 0.8)
  registerTemporaryEntity(label, 1800, 'label')
}
