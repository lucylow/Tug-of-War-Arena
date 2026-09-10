import { describe, expect, it } from "vitest";

import { createWorldSession, joinWorldSession, leaveWorldSession, refreshWorldSession, resetWorldSession } from "../lib/world/worldSession";
import { createWorldHandoff, parseWorldHandoff, validateWorldHandoff } from "../lib/world/handoff";
import { buildWorldInvite, parseWorldInviteSafe } from "../lib/world/invite";
import { WorldMatchSyncService } from "../lib/world/matchSync";
import { mergeActivity, mergeMatchResults, mergeMissionProgress, mergePresence } from "../lib/world/conflict";
import { canPull, recordPull, resetPlayer } from "../lib/world/rateLimit";
import { createRequestGuard } from "../lib/world/requestGuard";
import { createWorldHealth, meaningfulHealth } from "../lib/world/health";
import { createDemoSimulation } from "../lib/world/simulation";
import { normalizeProviderError } from "../lib/wallet/providerErrors";
import { isSafeWalletSession, isSessionFresh } from "../lib/wallet/session";
import { selectInjectedProvider } from "../lib/wallet/multiplex";
import { FRIENDZONE_WORLD_IDENTITY, resolveWorldName } from "../shared/worldIdentity";
import { createWorldMatchResult } from "../shared/match";
import { miniMapToWorld, worldToMiniMap } from "../shared/worldCoordinate";
import { REGIONS, regionAt } from "../shared/regions";
import { WORLD_FEED_VERSION, isSupportedFeedVersion } from "../shared/feedVersion";
import { verifyMatchProof } from "../shared/proof";
import { normalizeDisplayName } from "../shared/displayName";
import { sanitizeWorldLabel } from "../shared/labelSafety";
import { parseWorldInvite } from "../shared/invite";
import { matchFixture } from "../shared/fixtures/matchFixture";
import { playerFixture } from "../shared/fixtures/playerFixture";
import { proposalFixture } from "../shared/fixtures/proposalFixture";
import { DemoWorldClock } from "../shared/clock";
import { validateRoomJoin } from "../server/friendzoneRouter";
import { canPull as worldCanPull, recordPull as worldRecordPull, resetPlayer as worldResetPlayer } from "../decentraland-world/src/arena/inputLimiter";

describe("world session", () => {
  it("creates, joins, refreshes, and resets without presentation state", () => {
    resetWorldSession();
    const created = createWorldSession({ worldId: "friendzone", playerId: "local-player", roomId: "731XZ" });
    expect(created.status).toBe("loading");
    expect(joinWorldSession("731XZ").status).toBe("ready");
    expect(refreshWorldSession().lastSyncAt).toBeGreaterThan(0);
    expect(leaveWorldSession().status).toBe("idle");
    expect(resetWorldSession().sessionId).toBe("");
  });
});

describe("handoff and invite", () => {
  it("round-trips a secret-free handoff", () => {
    const payload = createWorldHandoff({ worldId: "friendzone", roomId: "731XZ", playerId: "local-player" });
    const parsed = parseWorldHandoff(JSON.stringify(payload));
    expect(parsed?.roomId).toBe("731XZ");
    expect(validateWorldHandoff({ ...payload, privateKey: "0xabc" })).toBeNull();
  });

  it("parses friendzone QR invites and fails closed", () => {
    expect(parseWorldInvite("friendzone://world?room=731XZ")?.roomCode).toBe("731XZ");
    expect(buildWorldInvite("731XZ")?.href).toContain("731XZ");
    expect(parseWorldInviteSafe("nope").error).toMatch(/expired or unavailable/i);
  });
});

describe("match sync and merge", () => {
  it("caches results and never overwrites live with demo", () => {
    const service = new WorldMatchSyncService();
    const result = createWorldMatchResult(matchFixture);
    service.submitResult(result);
    expect(service.getLatestResult()?.playerPulls).toBe(428);
    const live = { ...result, origin: "live" as const, playerPulls: 500 };
    const merged = mergeMatchResults([live], [result]);
    expect(merged[0]?.origin).toBe("live");
    expect(mergeMissionProgress({ id: "a", progress: 10, origin: "live" }, { id: "a", progress: 99, origin: "demo" }).progress).toBe(10);
    expect(mergePresence({ playerId: "a", heartbeat: 2, origin: "live" }, { playerId: "a", heartbeat: 9, origin: "demo" }).origin).toBe("live");
    expect(mergeActivity([], [{ id: "1", timestamp: 2, origin: "demo", text: "x" }], 6)).toHaveLength(1);
  });
});

describe("coordinates and regions", () => {
  it("maps the same World coordinate to mobile and back", () => {
    const point = playerFixture.local.spawn;
    const mini = worldToMiniMap(point);
    const back = miniMapToWorld(mini, point.y);
    expect(back.x).toBeCloseTo(point.x, 5);
    expect(back.z).toBeCloseTo(point.z, 5);
    expect(regionAt({ x: 16, y: 0, z: 16 })?.id).toBe("arena");
    expect(REGIONS.sunBase.label).toBe("SUN CREW BASE");
  });
});

describe("identity and labels", () => {
  it("uses Friendzone identity and a placeholder World name", () => {
    expect(FRIENDZONE_WORLD_IDENTITY.worldTitle).toBe("Tug of War Arena: Friendzone");
    expect(resolveWorldName()).toBe("YOUR-NAME.dcl.eth");
    expect(isSupportedFeedVersion(WORLD_FEED_VERSION)).toBe(true);
    expect(normalizeDisplayName("  NovaWisp  ")).toBe("NovaWisp");
    expect(sanitizeWorldLabel("a".repeat(80)).length).toBeLessThanOrEqual(48);
  });
});

describe("proofs and governance fixtures", () => {
  it("marks demo proofs as demo, never cryptographically verified", () => {
    expect(
      verifyMatchProof({
        id: "p1",
        matchId: "match_001",
        playerId: "local-player",
        result: "win",
        pulls: 428,
        hash: "0xdeadbeefcafebabe",
        timestamp: Date.now(),
        origin: "demo",
      }),
    ).toBe("demo");
    expect(proposalFixture[0]?.officialUrl).toContain("governance.decentraland.org");
    expect(proposalFixture[0]?.origin).toBe("demo");
  });
});

describe("input limiter", () => {
  it("debounces pulls on mobile and World copies", () => {
    resetPlayer("a");
    worldResetPlayer("a");
    expect(canPull("a", 1000, 220)).toBe(true);
    recordPull("a", 1000);
    expect(canPull("a", 1100, 220)).toBe(false);
    worldRecordPull("a", 1000);
    expect(worldCanPull("a", 1100, 220)).toBe(false);
  });
});

describe("wallet adapters stay behind the provider", () => {
  it("normalizes MetaMask-style codes and prefers isMetaMask without mutating globals", () => {
    expect(normalizeProviderError({ code: 4001 })).toBe("USER_REJECTED");
    expect(normalizeProviderError({ code: -32002 })).toBe("ALREADY_PENDING");
    expect(normalizeProviderError({ code: 4902 })).toBe("NETWORK_NOT_ADDED");
    expect(normalizeProviderError({ code: 4900 })).toBe("DISCONNECTED");
    const metamask = { request: async () => [], isMetaMask: true };
    const other = { request: async () => [], isMetaMask: false };
    expect(selectInjectedProvider({ request: other.request, providers: [other, metamask] })).toBe(metamask);
    expect(
      isSafeWalletSession({
        provider: "demo",
        address: "0x7A3F00000000000000000000000000000000C91D",
        chainId: 80002,
        connectedAt: Date.now(),
        privateKey: "nope",
      }),
    ).toBe(false);
    expect(isSessionFresh({ provider: "demo", address: "0x7A3F00000000000000000000000000000000C91D", chainId: 1, connectedAt: Date.now() })).toBe(true);
  });
});

describe("request guard and health", () => {
  it("ignores stale requests and isolates degraded subsystems", () => {
    const guard = createRequestGuard();
    const first = guard.next();
    const second = guard.next();
    expect(guard.isCurrent(first)).toBe(false);
    expect(guard.isCurrent(second)).toBe(true);
    const health = createWorldHealth();
    health.governance = "error";
    expect(meaningfulHealth(health).arena).toBeUndefined();
    expect(meaningfulHealth(health).governance).toBe("error");
  });
});

describe("demo simulation", () => {
  it("is deterministic, pauseable, and resettable", () => {
    const clock = new DemoWorldClock();
    const sim = createDemoSimulation(clock);
    sim.tick();
    sim.pause();
    const paused = sim.state().tick;
    sim.tick();
    expect(sim.state().tick).toBe(paused);
    sim.reset();
    expect(sim.state().sunScore).toBe(428);
  });
});

describe("server room validation", () => {
  it("rejects expired, full, duplicate, and invalid teams", () => {
    expect(validateRoomJoin({ roomCode: "nope", playerId: "x", team: "sun" }).ok).toBe(false);
    expect(validateRoomJoin({ roomCode: "731XZ", playerId: "p1", team: "sun" }).reason).toBe("duplicate");
    expect(validateRoomJoin({ roomCode: "731XZ", playerId: "fresh", team: "sun" }).ok).toBe(true);
  });
});
