import { MockEventEmitter } from "@/lib/mock/emitter";
import {
  generateAchievements,
  generateFactions,
  generateFriendships,
  generateGuilds,
  generateLeaderboard,
  generateMatches,
  generateNFTs,
  generatePredictions,
  generateQuests,
  generateReferrals,
  generateRentals,
  generateRewardPools,
  generateStakePositions,
  generateUsers,
  type Achievement,
  type Faction,
  type Friend,
  type Guild,
  type LeaderboardEntry,
  type MockMatch,
  type MockNFT,
  type MockRental,
  type MockUser,
  type PredictionMarket,
  type Quest,
  type Referral,
  type RewardPool,
  type StakePosition,
} from "@/lib/mock/generators";
import {
  DEFAULT_MOCK_SEED,
  MOCK_ACHIEVEMENT_COUNT,
  MOCK_MATCH_COUNT,
  MOCK_NFT_COUNT,
  MOCK_PREDICTION_COUNT,
  MOCK_QUEST_COUNT,
  MOCK_RENTAL_COUNT,
  MOCK_USER_COUNT,
  SeededRandom,
} from "@/lib/mock/seed";
import { DEMO_ACCOUNT } from "@/lib/web3/session";

export type MockWorldOptions = {
  userCount?: number;
  nftCount?: number;
  matchCount?: number;
  questCount?: number;
  predictionCount?: number;
  achievementCount?: number;
  rentalCount?: number;
};

export class MockWorld {
  users: MockUser[];
  nfts: MockNFT[];
  matches: MockMatch[];
  leaderboard: LeaderboardEntry[];
  friendships: Friend[];
  guilds: Guild[];
  quests: Quest[];
  factions: Faction[];
  predictions: PredictionMarket[];
  pools: RewardPool[];
  stakes: StakePosition[];
  rentals: MockRental[];
  achievements: Achievement[];
  referrals: Referral[];
  balances = new Map<string, number>();
  allowances = new Map<string, Map<string, number>>();
  events = new MockEventEmitter();
  currentUserId = "user_0";
  readonly seed: number;

  constructor(seed: number = DEFAULT_MOCK_SEED, options: MockWorldOptions = {}) {
    this.seed = seed;
    const random = new SeededRandom(seed);
    this.users = generateUsers(options.userCount ?? MOCK_USER_COUNT, random);
    this.nfts = generateNFTs(
      options.nftCount ?? MOCK_NFT_COUNT,
      this.users.map((user) => user.id),
      random,
    );
    this.matches = generateMatches(options.matchCount ?? MOCK_MATCH_COUNT, this.users, random);
    this.leaderboard = generateLeaderboard(this.users);
    this.friendships = generateFriendships(this.users, random);
    this.guilds = generateGuilds(this.users, random);
    this.quests = generateQuests(options.questCount ?? MOCK_QUEST_COUNT);
    this.factions = generateFactions(this.users, random);
    this.predictions = generatePredictions(
      options.predictionCount ?? MOCK_PREDICTION_COUNT,
      this.users,
      random,
    );
    this.pools = generateRewardPools(random);
    this.stakes = generateStakePositions(this.nfts, this.pools, random);
    this.rentals = generateRentals(options.rentalCount ?? MOCK_RENTAL_COUNT, this.nfts, random);
    this.achievements = generateAchievements(
      options.achievementCount ?? MOCK_ACHIEVEMENT_COUNT,
      this.users,
      random,
    );
    this.referrals = generateReferrals(this.users, random);

    for (const user of this.users) {
      this.balances.set(user.id, random.nextInt(100, 1000));
    }
    this.currentUserId = this.users[0]?.id ?? "user_0";
    const captainBalance = this.balances.get(this.currentUserId) ?? 500;
    this.balances.set(DEMO_ACCOUNT.toLowerCase(), captainBalance);
  }

  resolveUserId(id: string): string {
    if (id.toLowerCase() === DEMO_ACCOUNT.toLowerCase()) return this.currentUserId;
    return id;
  }

  requireUser(id: string): MockUser {
    const resolved = this.resolveUserId(id);
    const user = this.users.find((entry) => entry.id === resolved);
    if (!user) throw new Error(`User not found: ${id}`);
    return user;
  }

  requireNFT(id: number): MockNFT {
    const nft = this.nfts.find((entry) => entry.id === id);
    if (!nft) throw new Error(`NFT not found: ${id}`);
    return nft;
  }

  getBalance(userId: string): number {
    const resolved = this.resolveUserId(userId);
    return this.balances.get(resolved) ?? this.balances.get(userId.toLowerCase()) ?? 0;
  }

  setBalance(userId: string, amount: number): void {
    const resolved = this.resolveUserId(userId);
    this.balances.set(resolved, amount);
    if (resolved === this.currentUserId) {
      this.balances.set(DEMO_ACCOUNT.toLowerCase(), amount);
    }
  }

  rebuildLeaderboard(): void {
    this.leaderboard = generateLeaderboard(this.users);
  }
}
