import { MOCK_CONFIG, sampleDelayMs, sleep } from "@/lib/mock/config";
import type { MockEventHandler } from "@/lib/mock/emitter";
import type {
  Achievement,
  Faction,
  Guild,
  LeaderboardEntry,
  MockActivity,
  MockMatch,
  MockNFT,
  MockRental,
  MockRoom,
  MockUser,
  MockWorldEvent,
  PredictionMarket,
  Quest,
  Referral,
  RewardPool,
  StakePosition,
} from "@/lib/mock/generators";
import { DEFAULT_MOCK_SEED, SeededRandom } from "@/lib/mock/seed";
import type { IMockBlockchain } from "@/lib/mock/services/IMockBlockchain";
import { MockNFTContract } from "@/lib/mock/services/MockNFTContract";
import { MockSocialContract } from "@/lib/mock/services/MockSocialContract";
import { MockTokenContract } from "@/lib/mock/services/MockTokenContract";
import { MockWorld, type MockWorldOptions } from "@/lib/mock/services/MockWorld";

export type MockBlockchainOptions = MockWorldOptions & {
  latencyMs?: number;
};

export class MockBlockchain implements IMockBlockchain {
  readonly world: MockWorld;
  readonly nft: MockNFTContract;
  readonly token: MockTokenContract;
  readonly social: MockSocialContract;
  private readonly latencyMs: number;

  constructor(seed: number = DEFAULT_MOCK_SEED, options: MockBlockchainOptions = {}) {
    this.latencyMs = options.latencyMs ?? 0;
    this.world = new MockWorld(seed, options);
    this.nft = new MockNFTContract(this.world, this.latencyMs);
    this.token = new MockTokenContract(this.world, this.latencyMs);
    this.social = new MockSocialContract(this.world, this.latencyMs);
  }

  /** Public helper so demo facades can mimic RPC round-trips. */
  async simulateDelay(ms: number = this.latencyMs || sampleDelayMs()): Promise<void> {
    await sleep(ms);
  }

  private async delay(ms: number = this.latencyMs): Promise<void> {
    await sleep(ms);
  }

  async getCurrentUser(): Promise<MockUser> {
    await this.delay();
    return this.world.requireUser(this.world.currentUserId);
  }

  async setCurrentUser(id: string): Promise<MockUser> {
    await this.delay();
    const user = this.world.requireUser(id);
    this.world.currentUserId = user.id;
    return user;
  }

  async getUser(id: string): Promise<MockUser | null> {
    await this.delay();
    try {
      return this.world.requireUser(id);
    } catch {
      return this.world.users.find((user) => user.id === id) ?? null;
    }
  }

  async getAllUsers(): Promise<MockUser[]> {
    await this.delay();
    return this.world.users;
  }

  async getNFTs(ownerId?: string): Promise<MockNFT[]> {
    return this.nft.getNFTs(ownerId);
  }

  async getNFT(id: number): Promise<MockNFT | null> {
    return this.nft.getNFT(id);
  }

  async mintNFT(ownerId: string, rarity: string): Promise<MockNFT> {
    return this.nft.mintNFT(ownerId, rarity);
  }

  async stakeNFT(id: number, userId: string): Promise<void> {
    await this.social.stake(id, userId);
  }

  async unstakeNFT(id: number, userId: string): Promise<void> {
    await this.social.unstake(id, userId);
  }

  async evolveNFT(id: number, userId: string): Promise<MockNFT> {
    return this.nft.evolve(id, userId);
  }

  async transferNFT(from: string, to: string, tokenId: number): Promise<void> {
    await this.nft.transferFrom(from, to, tokenId);
  }

  async getMatches(): Promise<MockMatch[]> {
    await this.delay();
    return this.world.matches;
  }

  async getMatch(id: string): Promise<MockMatch | null> {
    await this.delay();
    return this.world.matches.find((match) => match.id === id) ?? null;
  }

  async createMatch(playerIds: string[]): Promise<MockMatch> {
    await this.delay();
    if (playerIds.length === 0) throw new Error("A match needs at least one player");
    const random = new SeededRandom(this.world.seed + this.world.matches.length + 1);
    const resolved = playerIds.map((id) => this.world.resolveUserId(id));
    const redScore = random.nextInt(8, 20);
    const blueScore = random.nextInt(0, 19);
    const winnerTeam: "red" | "blue" = redScore >= blueScore ? "red" : "blue";
    const duration = random.nextInt(30, 90);
    const startedAt = new Date();
    const match: MockMatch = {
      id: `match_${this.world.matches.length}`,
      participants: resolved,
      winnerTeam,
      redScore,
      blueScore,
      duration,
      startedAt,
      endedAt: new Date(startedAt.getTime() + duration * 1000),
      ropeHistory: Array.from({ length: 24 }, () => random.nextInt(-10, 10)),
      mvp: random.pick(resolved),
    };
    this.world.matches.push(match);
    for (const userId of resolved) {
      const user = this.world.users.find((entry) => entry.id === userId);
      if (!user) continue;
      user.matchesPlayed += 1;
      const won =
        (winnerTeam === "red" && user.faction !== "blue") || (winnerTeam === "blue" && user.faction === "blue");
      if (won) {
        user.wins += 1;
        user.xp += 25;
        user.reputation += 5;
      } else {
        user.losses += 1;
        user.xp += 8;
      }
    }
    this.world.rebuildLeaderboard();
    this.world.events.emit("MatchCreated", match);
    this.world.events.emit("MatchFinished", match);
    return match;
  }

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    await this.delay();
    this.world.rebuildLeaderboard();
    return this.world.leaderboard;
  }

  async getFriends(userId: string): Promise<string[]> {
    return this.social.getFriends(userId);
  }

  async getGuilds(): Promise<Guild[]> {
    return this.social.getGuilds();
  }

  async getGuild(id: string): Promise<Guild | null> {
    return this.social.getGuild(id);
  }

  async joinGuild(guildId: string, userId: string): Promise<void> {
    await this.social.joinGuild(guildId, userId);
  }

  async leaveGuild(guildId: string, userId: string): Promise<void> {
    await this.social.leaveGuild(guildId, userId);
  }

  async getReferrals(userId?: string): Promise<Referral[]> {
    return this.social.getReferrals(userId);
  }

  async getQuests(): Promise<Quest[]> {
    return this.social.getQuests();
  }

  async acceptQuest(questId: string, userId: string): Promise<void> {
    await this.social.acceptQuest(questId, userId);
  }

  async progressQuest(questId: string, userId: string, increment: number): Promise<void> {
    await this.social.progressQuest(questId, userId, increment);
  }

  async claimQuest(questId: string, userId: string): Promise<void> {
    await this.social.claimQuest(questId, userId);
  }

  async getAchievements(): Promise<Achievement[]> {
    return this.social.getAchievements();
  }

  async unlockAchievement(achievementId: string, userId: string): Promise<void> {
    await this.social.unlockAchievement(achievementId, userId);
  }

  async getFactions(): Promise<Faction[]> {
    await this.delay();
    return this.world.factions;
  }

  async joinFaction(factionId: string, userId: string): Promise<void> {
    await this.delay();
    const faction = this.world.factions.find((entry) => entry.id === factionId);
    if (!faction) throw new Error("Faction not found");
    const resolved = this.world.resolveUserId(userId);
    if (faction.members.includes(resolved)) throw new Error("Already in faction");
    for (const other of this.world.factions) {
      other.members = other.members.filter((id) => id !== resolved);
    }
    faction.members.push(resolved);
    const user = this.world.requireUser(resolved);
    user.faction = faction.id;
    this.world.events.emit("FactionJoined", { factionId, userId: resolved });
  }

  async getPredictions(): Promise<PredictionMarket[]> {
    await this.delay();
    return this.world.predictions;
  }

  async placePrediction(
    predictionId: string,
    userId: string,
    outcome: "yes" | "no",
    amount: number,
  ): Promise<void> {
    await this.delay();
    const prediction = this.world.predictions.find((entry) => entry.id === predictionId);
    if (!prediction) throw new Error("Prediction not found");
    if (prediction.resolved) throw new Error("Prediction already resolved");
    const resolved = this.world.resolveUserId(userId);
    const balance = this.world.getBalance(resolved);
    if (balance < amount) throw new Error("Insufficient balance");
    this.world.setBalance(resolved, balance - amount);
    if (outcome === "yes") prediction.totalYes += amount;
    else prediction.totalNo += amount;
    this.world.events.emit("PredictionPlaced", { predictionId, userId: resolved, outcome, amount });
  }

  async getBalance(userId: string): Promise<number> {
    return this.token.balanceOf(userId);
  }

  async transferTokens(from: string, to: string, amount: number): Promise<void> {
    await this.token.transfer(from, to, amount);
  }

  async getRewardPools(): Promise<RewardPool[]> {
    await this.delay();
    return this.world.pools;
  }

  async getStakePositions(userId?: string): Promise<StakePosition[]> {
    await this.delay();
    if (!userId) return this.world.stakes;
    const resolved = this.world.resolveUserId(userId);
    return this.world.stakes.filter((position) => position.stakerId === resolved);
  }

  async getPendingReward(tokenId: number): Promise<number> {
    return this.social.getPendingReward(tokenId);
  }

  async claimStakeReward(tokenId: number, userId: string): Promise<number> {
    return this.social.claimReward(tokenId, userId);
  }

  async getRentals(): Promise<MockRental[]> {
    await this.delay();
    return this.world.rentals;
  }

  async getRooms(): Promise<MockRoom[]> {
    await this.delay();
    return this.world.rooms;
  }

  async getWorldEvents(): Promise<MockWorldEvent[]> {
    await this.delay();
    return this.world.worldEvents;
  }

  async getActivity(): Promise<MockActivity[]> {
    await this.delay();
    return this.world.activity;
  }

  async listRental(tokenId: number, ownerId: string, fee: number, durationHours: number): Promise<void> {
    await this.social.listRental(tokenId, ownerId, fee, durationHours);
  }

  async rentNFT(tokenId: number, renterId: string): Promise<void> {
    await this.social.rent(tokenId, renterId);
  }

  on(eventName: string, callback: MockEventHandler): void {
    this.world.events.on(eventName, callback);
  }

  off(eventName: string, callback: MockEventHandler): void {
    this.world.events.off(eventName, callback);
  }
}

export const DEMO_MATCH_CREATE_DELAY_MS = MOCK_CONFIG.matchCreationDelayMs;
