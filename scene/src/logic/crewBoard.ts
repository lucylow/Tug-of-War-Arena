import type { CrewId } from './mapping'

export type CrewBoardEntry = {
  name: string
  streak: number
  crew: CrewId
}

/** Clearly synthetic local names for the in-world Friendzone board. */
export const DEMO_CREW_BOARD: CrewBoardEntry[] = [
  { name: 'Lumen', streak: 7, crew: 'sun' },
  { name: 'Nyx', streak: 5, crew: 'moon' },
  { name: 'Solace', streak: 4, crew: 'sun' },
  { name: 'Tide', streak: 3, crew: 'moon' },
]

export function formatCrewBoardLine(entry: CrewBoardEntry): string {
  const tag = entry.crew === 'sun' ? 'SUN' : 'MOON'
  return `${entry.name}  ·  ${tag}  ·  ${Math.max(0, entry.streak)} streak`
}

export function formatCrewBoardText(entries: CrewBoardEntry[] = DEMO_CREW_BOARD): string {
  const lines = entries.map((entry) => formatCrewBoardLine(entry))
  return ['FRIENDZONE CREW', ...lines].join('\n')
}

export function withJoinedPlayer(
  entries: CrewBoardEntry[],
  name: string,
  crew: CrewId,
): CrewBoardEntry[] {
  const trimmed = name.trim() || 'Visitor'
  const without = entries.filter((entry) => entry.name !== trimmed)
  return [{ name: trimmed, streak: 1, crew }, ...without].slice(0, 6)
}
