import { afterEach, describe, expect, it } from "vitest";

import { DemoModeManager } from "../../lib/mock/DemoModeManager";
import { generateLeaderboard, generateUsers } from "../../lib/mock/generators";
import { MockBlockchain } from "../../lib/mock/services/MockBlockchain";
import { MockBlockchainAsync } from "../../lib/mock/services/MockBlockchainAsync";
import { DEFAULT_MOCK_SEED, MOCK_NFT_COUNT, MOCK_USER_COUNT, SeededRandom } from "../../lib/mock/seed";

describe("SeededRandom", () => {
  it("replays the same integer stream for a given seed", () => {
    const first = new SeededRandom(DEFAULT_MOCK_SEED);
    const second = new SeededRandom(DEFAULT_MOCK_SEED);
    expect([first.nextInt(0, 50), first.nextInt(0, 30)]).toEqual([second.nextInt(0, 50), second.nextInt(0, 30)]);
  });
});

describe("mock generators", () => {
  it("builds identical user names and records for the same seed", () => {
    const first = generateUsers(8, new SeededRandom(7));
    const second = generateUsers(8, new SeededRandom(7));
    expect(first.map((user) => `${user.id}:${user.displayName}:${user.wins}`)).toEqual(
      second.map((user) => `${user.id}:${user.displayName}:${user.wins}`),
    );
  });

  it("ranks players by wins then win ratio", () => {
    const board = generateLeaderboard([
      {
        id: "user_a",
        displayName: "Ada",
        email: "ada@example.com",
        avatarUrl: "https://example.com/a",
        wins: 10,
        losses: 2,
        matchesPlayed: 12,
        level: 3,
        xp: 120,
        reputation: 50,
        isVerified: true,
        joinedAt: new Date(),
        lastActive: new Date(),
        faction: "red",
      },
      {
        id: "user_b",
        displayName: "Bea",
        email: "bea@example.com",
        avatarUrl: "https://example.com/b",
        wins: 10,
        losses: 10,
        matchesPlayed: 20,
        level: 2,
        xp: 80,
        reputation: 40,
        isVerified: false,
        joinedAt: new Date(),
        lastActive: new Date(),
        faction: "blue",
      },
    ]);
    expect(board[0]?.userId).toBe("user_a");
    expect(board.map((entry) => entry.rank)).toEqual([1, 2]);
  });
});

describe("MockBlockchain", () => {
  it("generates users and NFTs", async () => {
    const mock = new MockBlockchain(42);
    const users = await mock.getAllUsers();
    expect(users.length).toBe(MOCK_USER_COUNT);

    const nfts = await mock.getNFTs();
    expect(nfts.length).toBe(MOCK_NFT_COUNT);
  });

  it("allows NFT minting", async () => {
    const mock = new MockBlockchain(42);
    const user = await mock.getCurrentUser();
    const nft = await mock.mintNFT(user.id, "Rare");
    expect(nft.ownerId).toBe(user.id);
    expect(nft.rarity).toBe("Rare");
  });

  it("handles quest progression", async () => {
    const mock = new MockBlockchain(42);
    const user = await mock.getCurrentUser();
    const quests = await mock.getQuests();
    const quest = quests[0];
    expect(quest).toBeDefined();
    await mock.acceptQuest(quest!.id, user.id);
    await mock.progressQuest(quest!.id, user.id, 1);
    const updatedQuests = await mock.getQuests();
    expect(updatedQuests[0]?.progress).toBe(1);
  });

  it("transfers tokens and emits Transfer", async () => {
    const mock = new MockBlockchain(42, { userCount: 4, nftCount: 4, matchCount: 2 });
    const users = await mock.getAllUsers();
    const from = users[0]!.id;
    const to = users[1]!.id;
    const startFrom = await mock.getBalance(from);
    const startTo = await mock.getBalance(to);
    let seen: unknown = null;
    mock.on("Transfer", (payload) => {
      seen = payload;
    });
    await mock.transferTokens(from, to, 10);
    expect(await mock.getBalance(from)).toBe(startFrom - 10);
    expect(await mock.getBalance(to)).toBe(startTo + 10);
    expect(seen).toEqual({ from, to, amount: 10 });
  });

  it("rejects minting an unknown rarity", async () => {
    const mock = new MockBlockchain(1, { userCount: 1, nftCount: 0, matchCount: 0 });
    await expect(mock.mintNFT("user_0", "Plastic")).rejects.toThrow("Unknown rarity");
  });

  it("emits NFTMinted when a wearable is minted", async () => {
    const mock = new MockBlockchain(42, { userCount: 2, nftCount: 0, matchCount: 0 });
    const user = await mock.getCurrentUser();
    const minted = await new Promise<{ to: string; tokenId: number; rarity: string }>((resolve) => {
      mock.on("NFTMinted", (payload) => {
        resolve(payload as { to: string; tokenId: number; rarity: string });
      });
      void mock.mintNFT(user.id, "Epic");
    });
    expect(minted.to).toBe(user.id);
    expect(minted.rarity).toBe("Epic");
  });

  it("stakes an NFT and reports pending rewards", async () => {
    const mock = new MockBlockchain(42, { userCount: 2, nftCount: 4, matchCount: 0 });
    const user = await mock.getCurrentUser();
    const nft = await mock.mintNFT(user.id, "Rare");
    await mock.stakeNFT(nft.id, user.id);
    const owned = await mock.getNFTs(user.id);
    expect(owned.find((entry) => entry.id === nft.id)?.staked).toBe(true);
    const pending = await mock.getPendingReward(nft.id);
    expect(pending).toBeGreaterThanOrEqual(0);
  });

  it("maps the demo wallet account onto the seeded captain", async () => {
    const mock = new MockBlockchain(42, { userCount: 3, nftCount: 2, matchCount: 0 });
    const { DEMO_ACCOUNT, LEGACY_DEMO_IDENTITY_ADDRESS } = await import("../../lib/web3/session");
    const captain = await mock.getCurrentUser();
    const alias = await mock.getUser(DEMO_ACCOUNT);
    expect(alias?.id).toBe(captain.id);
    expect(await mock.getBalance(DEMO_ACCOUNT)).toBe(2500);
    expect(await mock.getBalance(LEGACY_DEMO_IDENTITY_ADDRESS)).toBe(2500);
    const nft = await mock.mintNFT(DEMO_ACCOUNT, "Uncommon");
    expect(nft.ownerId).toBe(captain.id);
    expect(nft.name).toContain("Uncommon");
  });

  it("seeds a localhost demo world with named crew, rooms, and events", async () => {
    const mock = new MockBlockchain(42);
    const users = await mock.getAllUsers();
    expect(users[0]?.displayName).toBe("Arena Captain");
    expect(users[1]?.displayName).toBe("RopeRanger");
    expect(users[2]?.displayName).toBe("PixelPuller");
    const rooms = await mock.getRooms();
    expect(rooms.length).toBeGreaterThanOrEqual(6);
    expect(rooms[0]?.title).toBe("Friday Night Pull");
    const events = await mock.getWorldEvents();
    expect(events.some((event) => event.status === "live")).toBe(true);
    const activity = await mock.getActivity();
    expect(activity.length).toBeGreaterThan(8);
    const owned = await mock.getNFTs("user_0");
    expect(owned.length).toBeGreaterThanOrEqual(8);
    expect(owned.some((nft) => nft.rarity === "Legendary")).toBe(true);
  });

  it("places a prediction and deducts FZONE", async () => {
    const mock = new MockBlockchain(42, { userCount: 4, nftCount: 2, matchCount: 0, predictionCount: 2 });
    const user = await mock.getCurrentUser();
    const markets = await mock.getPredictions();
    const market = markets[0]!;
    const yesBefore = market.totalYes;
    const before = await mock.getBalance(user.id);
    await mock.placePrediction(market.id, user.id, "yes", 7);
    expect(await mock.getBalance(user.id)).toBe(before - 7);
    const updated = (await mock.getPredictions()).find((entry) => entry.id === market.id);
    expect(updated?.totalYes).toBe(yesBefore + 7);
  });
});

describe("MockBlockchainAsync", () => {
  it("forwards reads through the delayed facade to the same inner world", async () => {
    const inner = new MockBlockchain(42, { userCount: 3, nftCount: 2, matchCount: 0, latencyMs: 0 });
    const asyncChain = new MockBlockchainAsync(inner);
    const [direct, delayed] = await Promise.all([inner.getCurrentUser(), asyncChain.getCurrentUser()]);
    expect(delayed.id).toBe(direct.id);
    expect(asyncChain.inner).toBe(inner);
  });
});

describe("DemoModeManager", () => {
  afterEach(() => {
    DemoModeManager.resetForTests();
  });

  it("toggles a seeded mock service", () => {
    const manager = DemoModeManager.getInstance();
    expect(manager.isActive()).toBe(false);
    manager.enable(42);
    expect(manager.isActive()).toBe(true);
    expect(manager.getSeed()).toBe(42);
    expect(manager.getMockService()).not.toBeNull();
    expect(manager.getFallbackReason()).toBe("explicit");
    manager.toggle();
    expect(manager.isActive()).toBe(false);
    expect(manager.getMockService()).toBeNull();
  });

  it("ensures a mock world even before enable is called", () => {
    const manager = DemoModeManager.getInstance();
    const service = manager.getOrCreateService();
    expect(manager.isActive()).toBe(true);
    expect(service).toBe(manager.getMockService());
    expect(manager.getFallbackReason()).toBe("demo-session");
  });

  it("notifies subscribers when demo mode changes", () => {
    const manager = DemoModeManager.getInstance();
    let ticks = 0;
    const stop = manager.subscribe(() => {
      ticks += 1;
    });
    manager.enable();
    manager.disable();
    stop();
    manager.enable();
    expect(ticks).toBe(2);
  });
});
