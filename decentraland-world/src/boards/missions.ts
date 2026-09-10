import { gold } from '../palette'
import { box } from '../entities/primitives'
import { worldLabel } from '../logic/labels'

const MISSIONS = [
  { title: 'PULL TOGETHER', progress: '84 / 100' },
  { title: 'THREE IN A ROW', progress: '2 / 3' },
  { title: 'SHOW SOME LOVE', progress: 'COMPLETE' },
]

export function createMissionBoard(): void {
  box(undefined, { x: 21.6, y: 1.7, z: 21.2 }, { x: 3.6, y: 2.8, z: 0.24 }, 'arena')
  worldLabel({ x: 21.6, y: 3.3, z: 21.3 }, 'MISSIONS', gold, 0.9)
  MISSIONS.forEach((mission, index) => {
    const y = 2.7 - index * 0.7
    worldLabel({ x: 21.6, y, z: 21.3 }, `${mission.title}\n${mission.progress}`, gold, 0.7)
    box(undefined, { x: 21.6, y: y - 0.28, z: 21.15 }, { x: 2.4, y: 0.08, z: 0.08 }, 'neutral')
    box(undefined, { x: 20.7, y: y - 0.28, z: 21.18 }, { x: index === 2 ? 2.2 : index === 0 ? 1.9 : 1.4, y: 0.08, z: 0.1 }, 'highlight')
  })
}
