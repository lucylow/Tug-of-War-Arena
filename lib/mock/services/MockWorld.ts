import { MockEventEmitter } from "@/lib/mock/emitter";
import {
  generateAchievements,
  generateActivity,
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
  generateRooms,
  generateStakePositions,
  generateUsers,
  generateWorldEvents,
  type Achievement,
  type Faction,
  type Friend,
  type Guild,
  type LeaderboardEntry,
  type MockActivity,
  type MockMatch,
  type MockNFT,
  type MockRental,
  type MockRoom,
  type MockUser,
  type MockWorldEvent,
  type PredictionMarket,
  type Quest,
  type Referral,
  type RewardPool,
  type StakePosition,
} from "@/lib/mock/generators";
import {
  DEFAULT_MOCK_SEED,
  MOCK_ACHIEVEMENT_COUNT,
  MOCK_ACTIVITY_COUNT,
  MOCK_MATCH_COUNT,
  MOCK_NFT_COUNT,
  MOCK_PREDICTION_COUNT,
  MOCK_QUEST_COUNT,
  MOCK_RENTAL_COUNT,
  MOCK_USER_COUNT,
  SeededRandom,
} from "@/lib/mock/seed";
import { DEMO_ACCOUNT_ALIASES } from "@/lib/web3/session";

const DEMO_ALIAS_SET = new Set(DEMO_ACCOUNT_ALIASES.map((alias) => alias.toLowerCase()));

export type MockWorldOptions = {
  userCount?: number;
  nftCount?: number;
  matchCount?: number;
  questCount?: number;
  predictionCount?: number;
  achievementCount?: number;
  rentalCount?: number;
  activityCount?: number;
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
  rooms: MockRoom[];
  worldEvents: MockWorldEvent[];
  activity: MockActivity[];
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
    this.rooms = generateRooms(this.users, random);
    this.worldEvents = generateWorldEvents(random);
    this.activity = generateActivity(this.users, random, options.activityCount ?? MOCK_ACTIVITY_COUNT);

    for (const user of this.users) {
      this.balances.set(user.id, random.nextInt(100, 1000));
    }
    this.currentUserId = this.users[0]?.id ?? "user_0";
    this.seedCaptainShowcase();
  }

  private seedCaptainShowcase(): void {
    const captainId = this.currentUserId;
    this.balances.set(captainId, 2500);
    this.syncDemoBalances(2500);

    const needed = 8;
    for (let index = 0; index < needed && index < this.nfts.length; index += 1) {
      this.nfts[index]!.ownerId = captainId;
    }
    const showcase = this.nfts.slice(0, needed);
    if (showcase[0]) {
      showcase[0].rarity = "Legendary";
      showcase[0].name = "Captain Sash";
      showcase[0].powerBonus = 50;
      showcase[0].speedBonus = 25;
      showcase[0].staked = false;
    }
    if (showcase[1]) {
      showcase[1].rarity = "Epic";
      showcase[1].name = "Sun Rope";
      showcase[1].staked = true;
    }
    if (showcase[2]) {
      showcase[2].rarity = "Rare";
      showcase[2].name = "Moon Gauntlet";
    }

    if (this.guilds[0] && !this.guilds[0].members.includes(captainId)) {
      this.guilds[0].members = [captainId, ...this.guilds[0].members.filter((id) => id !== captainId)];
      this.guilds[0].leaderId = captainId;
      this.guilds[0].name = "Crimson Dawn";
    }

    const live = this.matches.find((match) => match.winnerTeam === null);
    if (live && !live.participants.includes(captainId)) {
      live.participants = [captainId, ...live.participants.slice(0, 3)];
    } else if (this.matches[0] && !this.matches[0].participants.includes(captainId)) {
      this.matches[0].participants = [captainId, ...this.matches[0].participants.slice(0, 3)];
    }

    for (const achievement of this.achievements.slice(0, 5)) {
      if (!achievement.unlockedBy.includes(captainId)) {
        achievement.unlockedBy = [captainId, ...achievement.unlockedBy];
      }
    }

    if (this.rooms[0] && !this.rooms[0].memberIds.includes(captainId)) {
      this.rooms[0].captainId = captainId;
      this.rooms[0].memberIds = [captainId, ...this.rooms[0].memberIds.filter((id) => id !== captainId)].slice(0, this.rooms[0].maxPlayers);
      this.rooms[0].players = this.rooms[0].memberIds.length;
    }
  }

  resolveUserId(id: string): string {
    if (DEMO_ALIAS_SET.has(id.toLowerCase())) return this.currentUserId;
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
      this.syncDemoBalances(amount);
    }
  }

  rebuildLeaderboard(): void {
    this.leaderboard = generateLeaderboard(this.users);
  }

  private syncDemoBalances(amount: number): void {
    for (const alias of DEMO_ALIAS_SET) {
      this.balances.set(alias, amount);
    }
  }
}
