export type ArenaTeam = "sun" | "moon";

export function applyOpponentPressure(pull: number): number {
  const opponentPressure = pull > 0 ? 0.65 : 0.9;
  return Math.max(-44, pull - opponentPressure);
}

export function resolveTimeoutWinner(pull: number, team: ArenaTeam): ArenaTeam {
  if (pull > 0) return team;
  return team === "sun" ? "moon" : "sun";
}

export function hasReachedWinningLine(pull: number): boolean {
  return pull >= 44;
}

export function canInteractWithArena(input: {
  screen: string;
  showTutorial: boolean;
  resultCounted: boolean;
  timeRemaining: number;
}): boolean {
  return input.screen === "arena" && input.timeRemaining > 0 && !input.showTutorial && !input.resultCounted;
}

export function resolveArenaOutcome(pull: number, team: ArenaTeam): ArenaTeam | null {
  return hasReachedWinningLine(pull) ? team : null;
}
