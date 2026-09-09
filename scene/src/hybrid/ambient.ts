import { engine } from '@dcl/sdk/ecs'

import { createWorldSyncPacket } from './protocol'
import { tickHybridSimulation } from './simulation'
import { updateHybridScoreboard } from './renderer'
import type { HybridSimulationState, HybridWorldDataset } from './types'

type HybridRuntime = {
  elapsed: number
  state: HybridSimulationState
  dataset: HybridWorldDataset
}

export function startHybridAmbientLoop(runtime: HybridRuntime): void {
  engine.addSystem((deltaSeconds: number) => {
    runtime.elapsed += deltaSeconds
    if (runtime.elapsed <= 2) return
    runtime.elapsed = 0
    runtime.state = tickHybridSimulation(runtime.state, runtime.dataset, 2)
    runtime.dataset = {
      ...runtime.dataset,
      rooms: runtime.dataset.rooms.map((room) =>
        room.id === runtime.state.roomId
          ? {
              ...room,
              ropePosition: runtime.state.ropePosition,
              sunScore: runtime.state.sunScore,
              moonScore: runtime.state.moonScore,
              phase: runtime.state.phase,
            }
          : room,
      ),
      scoreboard: {
        ...runtime.dataset.scoreboard,
        sunScore: runtime.state.sunScore,
        moonScore: runtime.state.moonScore,
        ropePosition: runtime.state.ropePosition,
        leadingTeam:
          runtime.state.sunScore === runtime.state.moonScore
            ? 'tie'
            : runtime.state.sunScore > runtime.state.moonScore
              ? 'sun'
              : 'moon',
      },
    }
    updateHybridScoreboard(runtime.dataset)
    void createWorldSyncPacket(runtime.state, 'world-3d')
  })
}
