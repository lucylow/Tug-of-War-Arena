import { afterEach, describe, expect, it } from "vitest";

import { DemoModeManager } from "../../lib/mock/DemoModeManager";
import {
  findMockMatch,
  MOCK_FALLBACK_COPY,
  mockMatchReceipt,
  noteMockFallback,
  requireMockMatch,
  runLiveOrMock,
  shouldUseMockFallback,
  toArenaMatchView,
  withMockFallback,
} from "../../lib/mock/fallback";
import { generateQuests, generateUsers } from "../../lib/mock/generators";
import { MockBlockchain } from "../../lib/mock/services/MockBlockchain";
import { SeededRandom } from "../../lib/mock/seed";
import { SocialAPI } from "../../lib/social/SocialAPI";
import { socialFallbackSnapshot } from "../../lib/social/fallback-data";
import { resetSocialService } from "../../lib/social/SocialService";

describe("mock error fallback", () => {
  afterEach(() => {
    DemoModeManager.resetForTests();
    resetSocialService();
  });

  it("falls back to mock data for infrastructure errors but not wallet rejection", async () => {
    expect(shouldUseMockFallback({ code: 4001 })).toBe(false);
    expect(shouldUseMockFallback(new Error("nonce too low"))).toBe(false);
    expect(shouldUseMockFallback(new Error("network down"))).toBe(true);
    const value = await withMockFallback(
      async () => {
        throw new Error("RPC timeout");
      },
      () => 42,
      "request-failed",
    );
    expect(value).toBe(42);
    expect(DemoModeManager.getInstance().getFallbackReason()).toBe("request-failed");
    await expect(
      withMockFallback(
        async () => {
          throw { code: 4001 };
        },
        () => 1,
      ),
    ).rejects.toMatchObject({ code: 4001 });
  });

  it("skips live work when disabled and formats wallet errors when they must not fall back", async () => {
    let liveCalls = 0;
    const skipped = await runLiveOrMock({
      enabled: false,
      live: async () => {
        liveCalls += 1;
        return "live";
      },
      mock: () => "mock",
      reason: "unconfigured-contract",
    });
    expect(liveCalls).toBe(0);
    expect(skipped).toEqual({ value: "mock", usedFallback: true });

    await expect(
      runLiveOrMock({
        enabled: true,
        live: async () => {
          throw { code: 4001 };
        },
        mock: () => "mock",
      }),
    ).rejects.toThrow("Transaction was rejected in MetaMask.");
    expect(requireMockMatch([{ id: "match_3" } as never], 3).id).toBe("match_3");
    expect(() => requireMockMatch([], 9)).toThrow("Match not found");
  });

  it("maps seeded matches onto the on-chain match view used by the lobby panel", async () => {
    const mock = new MockBlockchain(7, { userCount: 4, nftCount: 0, matchCount: 3 });
    const matches = await mock.getMatches();
    const first = matches[0]!;
    const view = toArenaMatchView(first);
    expect(view.id).toBe("0");
    expect(view.players).toEqual(first.participants);
    expect(view.sunPower).toBe(String(first.redScore));
    expect(view.moonPower).toBe(String(first.blueScore));
    expect(findMockMatch(matches, 0)?.id).toBe("match_0");
    expect(mockMatchReceipt(first).hash).toBe("demo_match_0");
  });

  it("keeps captain identity and mixed quest progress in the fallback world", () => {
    const users = generateUsers(3, new SeededRandom(42));
    expect(users[0]?.displayName).toBe("Arena Captain");
    expect(users[0]?.faction).toBe("red");
    const quests = generateQuests(6);
    expect(quests.some((quest) => quest.progress === 0)).toBe(true);
    expect(quests.some((quest) => quest.completed)).toBe(true);
    expect(quests.some((quest) => quest.progress > 0 && !quest.completed)).toBe(true);
  });

  it("records a fallback reason when demo mode is forced on", () => {
    const service = noteMockFallback("unconfigured-contract");
    expect(service).toBe(DemoModeManager.getInstance().getMockService());
    expect(DemoModeManager.getInstance().getFallbackReason()).toBe("unconfigured-contract");
    expect(MOCK_FALLBACK_COPY.badge).toBe("DEMO DATA");
  });

  it("updates player stats when a mock match is created", async () => {
    const mock = new MockBlockchain(3, { userCount: 3, nftCount: 0, matchCount: 0 });
    const user = await mock.getCurrentUser();
    const before = user.matchesPlayed;
    const match = await mock.createMatch([user.id, "user_1"]);
    expect(match.participants).toContain(user.id);
    const after = await mock.getCurrentUser();
    expect(after.matchesPlayed).toBe(before + 1);
    const board = await mock.getLeaderboard();
    expect(board[0]?.rank).toBe(1);
  });

  it("recovers social reads from seeded fallback data", async () => {
    const snapshot = socialFallbackSnapshot();
    expect(snapshot.friends.length).toBeGreaterThan(3);
    expect(snapshot.guilds.some((guild) => guild.tag === "SUN")).toBe(true);
    const friends = await SocialAPI.getFriends();
    expect(friends.some((friend) => friend.displayName === "NovaNina")).toBe(true);
    const feed = await SocialAPI.getFeed(1);
    expect(feed.items.length).toBeGreaterThan(3);
  });
});
