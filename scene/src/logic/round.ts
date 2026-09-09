import type { CrewId } from './mapping'
import type { ArenaVisualState } from './snapshot'

/** Spec round labels used by the world HUD and pads. */
export type WorldRoundPhase = 'lobby' | 'active' | 'finished'

export function toWorldPhase(phase: ArenaVisualState['phase']): WorldRoundPhase {
  if (phase === 'results') return 'finished'
  if (phase === 'live' || phase === 'countdown') return 'active'
  return 'lobby'
}

export function shouldAcceptPull(phase: WorldRoundPhase): boolean {
  return phase === 'lobby' || phase === 'active'
}

export function shouldAcceptRematch(phase: WorldRoundPhase): boolean {
  return phase === 'finished' || phase === 'lobby'
}

export function roundStatusCopy(phase: WorldRoundPhase, winner: CrewId | null): string {
  if (phase === 'lobby') return 'CHOOSE A CREW · TAP PULL TO START'
  if (phase === 'active') return 'PULL THE ROPE'
  if (winner === 'sun') return 'SUN CREW WINS · REMATCH ON THE GOLD PAD'
  if (winner === 'moon') return 'MOON CREW WINS · REMATCH ON THE GOLD PAD'
  return 'ROUND OVER · REMATCH ON THE GOLD PAD'
}

export function roundTitle(): string {
  return 'TUG OF WAR ARENA'
}
