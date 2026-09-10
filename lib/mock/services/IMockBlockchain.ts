import type { MockEventHandler } from "@/lib/mock/emitter";
import type {
  Achievement,
  Faction,
  Friend,
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

export type { Friend };

export interface IMockBlockchain {
  getCurrentUser(): Promise<MockUser>;
  getUser(id: string): Promise<MockUser | null>;
  getAllUsers(): Promise<MockUser[]>;
  setCurrentUser(id: string): Promise<MockUser>;

  getNFTs(ownerId?: string): Promise<MockNFT[]>;
  getNFT(id: number): Promise<MockNFT | null>;
  mintNFT(ownerId: string, rarity: string): Promise<MockNFT>;
  stakeNFT(id: number, userId: string): Promise<void>;
  unstakeNFT(id: number, userId: string): Promise<void>;
  evolveNFT(id: number, userId: string): Promise<MockNFT>;
  transferNFT(from: string, to: string, tokenId: number): Promise<void>;

  getMatches(): Promise<MockMatch[]>;
  getMatch(id: string): Promise<MockMatch | null>;
  createMatch(playerIds: string[]): Promise<MockMatch>;

  getLeaderboard(): Promise<LeaderboardEntry[]>;

  getFriends(userId: string): Promise<string[]>;
  getGuilds(): Promise<Guild[]>;
  getGuild(id: string): Promise<Guild | null>;
  joinGuild(guildId: string, userId: string): Promise<void>;
  leaveGuild(guildId: string, userId: string): Promise<void>;
  getReferrals(userId?: string): Promise<Referral[]>;

  getQuests(): Promise<Quest[]>;
  acceptQuest(questId: string, userId: string): Promise<void>;
  progressQuest(questId: string, userId: string, increment: number): Promise<void>;
  claimQuest(questId: string, userId: string): Promise<void>;
  getAchievements(): Promise<Achievement[]>;
  unlockAchievement(achievementId: string, userId: string): Promise<void>;

  getFactions(): Promise<Faction[]>;
  joinFaction(factionId: string, userId: string): Promise<void>;

  getPredictions(): Promise<PredictionMarket[]>;
  placePrediction(predictionId: string, userId: string, outcome: "yes" | "no", amount: number): Promise<void>;

  getBalance(userId: string): Promise<number>;
  transferTokens(from: string, to: string, amount: number): Promise<void>;

  getRewardPools(): Promise<RewardPool[]>;
  getStakePositions(userId?: string): Promise<StakePosition[]>;
  getPendingReward(tokenId: number): Promise<number>;
  claimStakeReward(tokenId: number, userId: string): Promise<number>;
  getRentals(): Promise<MockRental[]>;
  listRental(tokenId: number, ownerId: string, fee: number, durationHours: number): Promise<void>;
  rentNFT(tokenId: number, renterId: string): Promise<void>;

  getRooms(): Promise<MockRoom[]>;
  getWorldEvents(): Promise<MockWorldEvent[]>;
  getActivity(): Promise<MockActivity[]>;

  on(eventName: string, callback: MockEventHandler): void;
  off(eventName: string, callback: MockEventHandler): void;
}
