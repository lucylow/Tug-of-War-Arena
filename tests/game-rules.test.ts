import { describe, expect, it } from "vitest";

import { applyOpponentPressure, canInteractWithArena, hasReachedWinningLine, resolveArenaOutcome, resolveTimeoutWinner } from "../lib/game-rules";

describe("arena game rules", () => {
  it("applies stronger opponent pressure while the player is behind or neutral", () => {
    expect(applyOpponentPressure(0)).toBe(-0.9);
    expect(applyOpponentPressure(-10)).toBe(-10.9);
  });

  it("keeps positive momentum while applying the lighter counter-pressure", () => {
    expect(applyOpponentPressure(10)).toBeCloseTo(9.35);
  });

  it("resolves a timeout in favor of the side with positive rope momentum", () => {
    expect(resolveTimeoutWinner(4, "sun")).toBe("sun");
    expect(resolveTimeoutWinner(0, "sun")).toBe("moon");
    expect(resolveTimeoutWinner(-3, "moon")).toBe("sun");
  });

  it("only reports a winning-line result at or beyond the arena boundary", () => {
    expect(hasReachedWinningLine(43.99)).toBe(false);
    expect(hasReachedWinningLine(44)).toBe(true);
    expect(hasReachedWinningLine(50)).toBe(true);
  });

  it("resolves a winning-line outcome without inventing a result below the boundary", () => {
    expect(resolveArenaOutcome(43.99, "sun")).toBeNull();
    expect(resolveArenaOutcome(44, "sun")).toBe("sun");
    expect(resolveArenaOutcome(44, "moon")).toBe("moon");
  });

  it("accepts arena interactions only while the active match is unresolved and timed", () => {
    expect(canInteractWithArena({ screen: "arena", showTutorial: false, resultCounted: false, timeRemaining: 30 })).toBe(true);
    expect(canInteractWithArena({ screen: "arena", showTutorial: false, resultCounted: false, timeRemaining: 1 })).toBe(true);
    expect(canInteractWithArena({ screen: "arena", showTutorial: false, resultCounted: false, timeRemaining: 0 })).toBe(false);
    expect(canInteractWithArena({ screen: "arena", showTutorial: true, resultCounted: false, timeRemaining: 30 })).toBe(false);
    expect(canInteractWithArena({ screen: "arena", showTutorial: false, resultCounted: true, timeRemaining: 30 })).toBe(false);
    expect(canInteractWithArena({ screen: "results", showTutorial: false, resultCounted: false, timeRemaining: 30 })).toBe(false);
  });
});
