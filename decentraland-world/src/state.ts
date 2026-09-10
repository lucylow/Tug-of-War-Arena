export type WorldRuntimeState = {
  sun: number
  moon: number
  pull: number
  round: number
  streak: number
  timer: string
  frozen: boolean
  roomCode: string
  graphics: 'low' | 'medium' | 'high'
  reducedMotion: boolean
  presentation: boolean
}

export function createInitialState(): WorldRuntimeState {
  return {
    sun: 428,
    moon: 381,
    pull: 0.12,
    round: 3,
    streak: 4,
    timer: '00:42',
    frozen: false,
    roomCode: '731XZ',
    graphics: 'medium',
    reducedMotion: false,
    presentation: false,
  }
}
