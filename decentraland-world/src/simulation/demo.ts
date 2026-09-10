import { DemoWorldClock } from './clock'

export type DemoSimState = {
  tick: number
  sun: number
  moon: number
  room: string
}

export function createDemoSimulation(clock: DemoWorldClock) {
  let state: DemoSimState = { tick: 0, sun: 428, moon: 381, room: '731XZ' }
  return {
    state: () => state,
    tick() {
      clock.advance(250)
      state = {
        ...state,
        tick: state.tick + 1,
        sun: state.sun + (state.tick % 3 === 0 ? 1 : 0),
        moon: state.moon + (state.tick % 4 === 0 ? 1 : 0),
      }
      return state
    },
    reset() {
      clock.reset()
      state = { tick: 0, sun: 428, moon: 381, room: '731XZ' }
    },
    pause: () => clock.pause(),
    resume: () => clock.resume(),
  }
}
