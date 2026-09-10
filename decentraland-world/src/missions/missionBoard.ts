import { Vector3 } from '@dcl/sdk/math'
import { COLOR } from '../config'
import type { WorldMission } from '../mock3d'
import { box } from '../ui/primitives'
import { worldLabel } from '../ui/labels'

export function createMissionBoard(missions: WorldMission[]): void {
  box(Vector3.create(23.6, 1.2, 7.2), Vector3.create(4.4, 2.4, 0.18), COLOR.midnight, true)
  const lines = ['DAILY MISSIONS', ...missions.slice(0, 5).map((mission) => `${mission.title} ${mission.progress}/${mission.target} DEMO`)]
  worldLabel(lines.join('\n'), Vector3.create(23.6, 2.6, 7.4), 0.7)
}
