/**
 * Throttled arena steps on top of Friendzone game rules.
 * Visual feedback lives in Reanimated; this module only accepts or rejects
 * pulls, surges, and reactions.
 */

import {
  applyOpponentPressure,
  canInteractWithArena,
  resolveArenaOutcome,
  resolveTimeoutWinner,
  type ArenaTeam,
} from "../game-rules";
import { PULL_MIN_INTERVAL_MS, REACTION_MIN_INTERVAL_MS, SURGE_MIN_INTERVAL_MS, canAcceptAt } from "./throttle";

export interface MobileMatchState {
  screen: string;
  showTutorial: boolean;
  resultCounted: boolean;
  timeRemaining: number;
  pull: number;
  taps: number;
  streak: number;
  team: ArenaTeam;
  lastPullAt: number;
  lastReactionAt: number;
  lastSurgeAt: number;
  surgeReady: boolean;
}

export function createMobileMatchState(team: ArenaTeam = "sun"): MobileMatchState {
  return {
    screen: "arena",
    showTutorial: false,
    resultCounted: false,
    timeRemaining: 30,
    pull: 0,
    taps: 0,
    streak: 0,
    team,
    lastPullAt: Number.NEGATIVE_INFINITY,
    lastReactionAt: Number.NEGATIVE_INFINITY,
    lastSurgeAt: Number.NEGATIVE_INFINITY,
    surgeReady: false,
  };
}

function playable(state: MobileMatchState): boolean {
  return canInteractWithArena({
    screen: state.screen,
    showTutorial: state.showTutorial,
    resultCounted: state.resultCounted,
    timeRemaining: state.timeRemaining,
  });
}

export function applyThrottledPull(
  state: MobileMatchState,
  now: number,
  minInterval = PULL_MIN_INTERVAL_MS,
): { accepted: boolean; state: MobileMatchState } {
  if (!playable(state) || !canAcceptAt(state.lastPullAt, minInterval, now)) {
    return { accepted: false, state };
  }
  const nextTaps = state.taps + 1;
  const nextStreak = state.streak + 1;
  const swing = state.team === "sun" ? 2.3 : 2.1;
  const nextPull = Math.min(44, state.pull + swing + (nextStreak % 7 === 0 ? 3 : 0));
  const winner = resolveArenaOutcome(nextPull, state.team);
  return {
    accepted: true,
    state: {
      ...state,
      taps: nextTaps,
      streak: nextStreak,
      pull: nextPull,
      lastPullAt: now,
      surgeReady: nextStreak >= 7,
      resultCounted: winner ? true : state.resultCounted,
    },
  };
}

export function applyThrottledReaction(
  state: MobileMatchState,
  now: number,
  minInterval = REACTION_MIN_INTERVAL_MS,
): { accepted: boolean; state: MobileMatchState } {
  if (!playable(state) || !canAcceptAt(state.lastReactionAt, minInterval, now)) {
    return { accepted: false, state };
  }
  return { accepted: true, state: { ...state, lastReactionAt: now } };
}

export function applyThrottledSurge(
  state: MobileMatchState,
  now: number,
  minInterval = SURGE_MIN_INTERVAL_MS,
): { accepted: boolean; state: MobileMatchState } {
  if (!state.surgeReady || !playable(state) || !canAcceptAt(state.lastSurgeAt, minInterval, now)) {
    return { accepted: false, state };
  }
  const nextPull = Math.min(44, state.pull + 8);
  const winner = resolveArenaOutcome(nextPull, state.team);
  return {
    accepted: true,
    state: {
      ...state,
      pull: nextPull,
      surgeReady: false,
      lastSurgeAt: now,
      resultCounted: winner ? true : state.resultCounted,
    },
  };
}

export function tickOpponent(state: MobileMatchState): MobileMatchState {
  if (!playable(state)) return state;
  const nextPull = applyOpponentPressure(state.pull);
  const timeRemaining = Math.max(0, state.timeRemaining - 1);
  if (timeRemaining <= 0 && !state.resultCounted) {
    resolveTimeoutWinner(nextPull, state.team);
    return {
      ...state,
      pull: nextPull,
      timeRemaining: 0,
      resultCounted: true,
      streak: Math.max(0, state.streak - 1),
    };
  }
  return {
    ...state,
    pull: nextPull,
    timeRemaining,
    streak: Math.max(0, state.streak - 1),
  };
}
