import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { ambientOffset, applyAmbientOrigin } from "../scene/src/logic/ambient";
import { DEMO_CREW_BOARD, formatCrewBoardLine, formatCrewBoardText, withJoinedPlayer } from "../scene/src/logic/crewBoard";
import {
  getAmbientCloudOrigin,
  getAmbientSparkleOrigin,
  getCrewBasePosition,
  getCrewBoardPosition,
  getCrewChoicePosition,
  getEntrancePosition,
  getGovernancePlazaPosition,
  getGovernanceWorkflowBoardPosition,
  getPortalPosition,
  getProposalPedestalPosition,
  getPullPadPosition,
  getRematchPadPosition,
  isInsideParcel,
} from "../scene/src/logic/journey";
import { ARENA_CENTER, MATCH_DURATION_SECONDS } from "../scene/src/logic/mapping";
import { formatReactionText, reactionOrigin, reactionPose, REACTION_LIFETIME } from "../scene/src/logic/reactions";
import { roundStatusCopy, shouldAcceptPull, shouldAcceptRematch, toWorldPhase } from "../scene/src/logic/round";
import { createDemoSnapshot, stepDemoSnapshot } from "../scene/src/logic/snapshot";
import {
  WORLD_BRIDGE_CHANNEL,
  encodeWorldBridgeEvent,
  parseWorldBridgeEvent,
} from "../scene/src/logic/worldBridge";

describe("world round contract", () => {
  it("starts in lobby and maps scene phases onto lobby/active/finished", () => {
    expect(createDemoSnapshot().phase).toBe("lobby");
    expect(toWorldPhase("idle")).toBe("lobby");
    expect(toWorldPhase("lobby")).toBe("lobby");
    expect(toWorldPhase("live")).toBe("active");
    expect(toWorldPhase("countdown")).toBe("active");
    expect(toWorldPhase("results")).toBe("finished");
    expect(shouldAcceptPull("lobby")).toBe(true);
    expect(shouldAcceptPull("active")).toBe(true);
    expect(shouldAcceptPull("finished")).toBe(false);
    expect(shouldAcceptRematch("finished")).toBe(true);
  });

  it("starts a round from the first pull and ignores pulls after the finish", () => {
    const started = stepDemoSnapshot(createDemoSnapshot(), 0.016, 2);
    expect(started.phase).toBe("live");
    expect(started.timeRemaining).toBeLessThanOrEqual(MATCH_DURATION_SECONDS);
    expect(started.pull).toBeGreaterThan(0);
    const finished = stepDemoSnapshot(createDemoSnapshot({ phase: "results", pull: 44 }), 0.016, 4);
    expect(finished.phase).toBe("results");
    expect(finished.pull).toBe(44);
    expect(roundStatusCopy("lobby", null)).toContain("PULL");
    expect(roundStatusCopy("finished", "sun")).toContain("SUN CREW");
  });
});

describe("world journey layout", () => {
  it("keeps the entrance-to-portal walk inside the 2x2 parcel and south of the rope", () => {
    const entrance = getEntrancePosition();
    const pull = getPullPadPosition();
    const rematch = getRematchPadPosition();
    const board = getCrewBoardPosition();
    const crewPortal = getPortalPosition("crew");
    const mobilePortal = getPortalPosition("mobile");
    const plaza = getGovernancePlazaPosition();
    const workflow = getGovernanceWorkflowBoardPosition();
    expect(entrance.z).toBeLessThan(ARENA_CENTER.z);
    expect(pull.z).toBeLessThan(ARENA_CENTER.z);
    expect(getCrewChoicePosition("sun").x).toBeLessThan(getCrewChoicePosition("moon").x);
    expect(getCrewBasePosition("sun").x).toBeLessThan(ARENA_CENTER.x);
    expect(getCrewBasePosition("moon").x).toBeGreaterThan(ARENA_CENTER.x);
    expect(board.z).toBeGreaterThan(ARENA_CENTER.z);
    expect(plaza.z).toBeGreaterThan(ARENA_CENTER.z);
    expect(plaza.z).toBeLessThan(board.z);
    expect(workflow.z).toBeGreaterThan(plaza.z);
    expect(getProposalPedestalPosition(0).x).toBeLessThan(getProposalPedestalPosition(2).x);
    expect(crewPortal.x).toBeLessThan(mobilePortal.x);
    expect(rematch.x).toBeGreaterThan(pull.x);
    for (const point of [entrance, pull, rematch, board, crewPortal, mobilePortal, plaza, workflow]) {
      expect(isInsideParcel(point)).toBe(true);
    }
  });
});

describe("world bridge event contract", () => {
  it("accepts pull, reaction, join, and rematch payloads and rejects junk", () => {
    expect(WORLD_BRIDGE_CHANNEL).toBe("tug-of-war-arena");
    expect(parseWorldBridgeEvent({ type: "pull", amount: 2, crew: "red" })).toEqual({
      type: "pull",
      amount: 2,
      crew: "sun",
    });
    expect(parseWorldBridgeEvent({ type: "reaction", emoji: "🔥", from: "Nyx" })?.type).toBe("reaction");
    expect(parseWorldBridgeEvent({ type: "join", crew: "moon", name: "Visitor" })).toMatchObject({
      type: "join",
      crew: "moon",
    });
    expect(parseWorldBridgeEvent({ type: "rematch" })).toEqual({ type: "rematch" });
    expect(parseWorldBridgeEvent({ type: "pull", amount: 0 })).toBeNull();
    expect(parseWorldBridgeEvent({ type: "explode" })).toBeNull();
    expect(encodeWorldBridgeEvent({ type: "pull", amount: 1 })).toEqual({ type: "pull", amount: 1 });
  });
});

describe("world social and ambient helpers", () => {
  it("formats the Friendzone board and floats reactions upward", () => {
    expect(formatCrewBoardText()).toContain("FRIENDZONE CREW");
    expect(formatCrewBoardLine(DEMO_CREW_BOARD[0]!)).toContain("Lumen");
    const joined = withJoinedPlayer(DEMO_CREW_BOARD, "Judge", "sun");
    expect(joined[0]?.name).toBe("Judge");
    expect(formatReactionText("🔥", "Plaza")).toBe("🔥  Plaza");
    const origin = reactionOrigin(0);
    const start = reactionPose(0, origin);
    const later = reactionPose(REACTION_LIFETIME / 2, origin);
    expect(later.position.y).toBeGreaterThan(start.position.y);
    expect(reactionPose(REACTION_LIFETIME + 0.1, origin).alive).toBe(false);
  });

  it("moves clouds and sparkles from a single offset function", () => {
    const cloud = applyAmbientOrigin(getAmbientCloudOrigin(0), ambientOffset("cloud", 1.5, 0.2, 1.8));
    const sparkle = applyAmbientOrigin(getAmbientSparkleOrigin(3), ambientOffset("sparkle", 1.5, 0.2, 0.55));
    expect(cloud.x).not.toBe(getAmbientCloudOrigin(0).x);
    expect(sparkle.y).not.toBe(getAmbientSparkleOrigin(3).y);
    expect(isInsideParcel(cloud, 40)).toBe(true);
  });
});

describe("world manifest", () => {
  it("declares a Worlds NAME placeholder for deployment", () => {
    const scene = JSON.parse(readFileSync(resolve("scene/scene.json"), "utf8")) as {
      worldConfiguration?: { name?: string };
      display: { description: string };
    };
    expect(scene.worldConfiguration?.name).toBe("YOUR-NAME.dcl.eth");
    expect(scene.display.description.toLowerCase()).toContain("sdk7");
  });
});
