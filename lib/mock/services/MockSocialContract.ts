import { sleep } from "@/lib/mock/config";
import { pendingStakeReward, type Achievement, type Guild, type Quest } from "@/lib/mock/generators";
import type { MockWorld } from "@/lib/mock/services/MockWorld";

/**
 * In-memory social layer: reputation, quests, guilds, referrals, staking, rentals.
 */
export class MockSocialContract {
  constructor(
    private readonly world: MockWorld,
    private readonly delayMs: number = 0,
  ) {}

  private async delay(): Promise<void> {
    await sleep(this.delayMs);
  }

  async getReputation(userId: string): Promise<number> {
    await this.delay();
    return this.world.requireUser(userId).reputation;
  }

  async getFriends(userId: string): Promise<string[]> {
    await this.delay();
    const resolved = this.world.resolveUserId(userId);
    return this.world.friendships
      .filter((friend) => friend.userId === resolved || friend.friendId === resolved)
      .map((friend) => (friend.userId === resolved ? friend.friendId : friend.userId));
  }

  async getGuilds(): Promise<Guild[]> {
    await this.delay();
    return this.world.guilds;
  }

  async getGuild(id: string): Promise<Guild | null> {
    await this.delay();
    return this.world.guilds.find((guild) => guild.id === id) ?? null;
  }

  async joinGuild(guildId: string, userId: string): Promise<void> {
    await this.delay();
    const guild = this.world.guilds.find((entry) => entry.id === guildId);
    if (!guild) throw new Error("Guild not found");
    const resolved = this.world.resolveUserId(userId);
    if (guild.members.includes(resolved)) throw new Error("Already member");
    guild.members.push(resolved);
    this.world.events.emit("GuildJoined", { guildId, userId: resolved });
  }

  async leaveGuild(guildId: string, userId: string): Promise<void> {
    await this.delay();
    const guild = this.world.guilds.find((entry) => entry.id === guildId);
    if (!guild) throw new Error("Guild not found");
    const resolved = this.world.resolveUserId(userId);
    guild.members = guild.members.filter((id) => id !== resolved);
    this.world.events.emit("GuildLeft", { guildId, userId: resolved });
  }

  async getQuests(): Promise<Quest[]> {
    await this.delay();
    return this.world.quests;
  }

  async acceptQuest(questId: string, userId: string): Promise<void> {
    await this.delay();
    const quest = this.world.quests.find((entry) => entry.id === questId);
    if (!quest) throw new Error("Quest not found");
    quest.progress = 0;
    quest.completed = false;
    quest.claimed = false;
    this.world.events.emit("QuestAccepted", { questId, userId: this.world.resolveUserId(userId) });
  }

  async progressQuest(questId: string, userId: string, increment: number): Promise<void> {
    await this.delay();
    const quest = this.world.quests.find((entry) => entry.id === questId);
    if (!quest || quest.completed) return;
    quest.progress += increment;
    if (quest.progress >= quest.target) {
      quest.completed = true;
      this.world.events.emit("QuestCompleted", { questId, userId: this.world.resolveUserId(userId) });
    }
  }

  async claimQuest(questId: string, userId: string): Promise<void> {
    await this.delay();
    const quest = this.world.quests.find((entry) => entry.id === questId);
    if (!quest || !quest.completed || quest.claimed) throw new Error("Invalid quest state");
    quest.claimed = true;
    const resolved = this.world.resolveUserId(userId);
    const user = this.world.requireUser(resolved);
    user.xp += quest.rewardXP;
    this.world.setBalance(resolved, this.world.getBalance(resolved) + quest.rewardTokens);
    this.world.events.emit("QuestClaimed", { questId, userId: resolved });
  }

  async getAchievements(): Promise<Achievement[]> {
    await this.delay();
    return this.world.achievements;
  }

  async unlockAchievement(achievementId: string, userId: string): Promise<void> {
    await this.delay();
    const achievement = this.world.achievements.find((entry) => entry.id === achievementId);
    if (!achievement) throw new Error("Achievement not found");
    const resolved = this.world.resolveUserId(userId);
    if (!achievement.unlockedBy.includes(resolved)) {
      achievement.unlockedBy.push(resolved);
      const user = this.world.requireUser(resolved);
      user.xp += achievement.xpBonus;
    }
    this.world.events.emit("AchievementUnlocked", { achievementId, userId: resolved });
  }

  async getReferrals(userId?: string) {
    await this.delay();
    if (!userId) return this.world.referrals;
    const resolved = this.world.resolveUserId(userId);
    return this.world.referrals.filter(
      (referral) => referral.referrerId === resolved || referral.refereeId === resolved,
    );
  }

  async stake(tokenId: number, userId: string, poolId: number = 0): Promise<void> {
    await this.delay();
    const nft = this.world.requireNFT(tokenId);
    const resolved = this.world.resolveUserId(userId);
    if (nft.ownerId !== resolved) throw new Error("Invalid NFT or owner");
    if (nft.staked) throw new Error("Already staked");
    const pool = this.world.pools.find((entry) => entry.id === poolId) ?? this.world.pools[0];
    if (!pool) throw new Error("No staking pool available");
    nft.staked = true;
    this.world.stakes.push({
      tokenId,
      stakerId: resolved,
      poolId: pool.id,
      stakedAt: new Date(),
      accumulatedReward: 0,
      claimedReward: 0,
    });
    pool.totalStaked += 1;
    this.world.events.emit("Staked", { tokenId, staker: resolved, poolId: pool.id });
  }

  async unstake(tokenId: number, userId: string): Promise<void> {
    await this.delay();
    const nft = this.world.requireNFT(tokenId);
    const resolved = this.world.resolveUserId(userId);
    if (nft.ownerId !== resolved) throw new Error("Invalid NFT or owner");
    nft.staked = false;
    const position = this.world.stakes.find((entry) => entry.tokenId === tokenId && entry.stakerId === resolved);
    if (position) {
      const pool = this.world.pools.find((entry) => entry.id === position.poolId);
      if (pool) pool.totalStaked = Math.max(0, pool.totalStaked - 1);
      this.world.stakes = this.world.stakes.filter((entry) => entry !== position);
    }
    this.world.events.emit("Unstaked", { tokenId, staker: resolved });
  }

  async getPendingReward(tokenId: number): Promise<number> {
    await this.delay();
    const position = this.world.stakes.find((entry) => entry.tokenId === tokenId);
    if (!position) return 0;
    return pendingStakeReward(position);
  }

  async claimReward(tokenId: number, userId: string): Promise<number> {
    await this.delay();
    const resolved = this.world.resolveUserId(userId);
    const position = this.world.stakes.find((entry) => entry.tokenId === tokenId && entry.stakerId === resolved);
    if (!position) throw new Error("Stake position not found");
    const pending = pendingStakeReward(position);
    position.claimedReward += pending;
    this.world.setBalance(resolved, this.world.getBalance(resolved) + pending);
    this.world.events.emit("RewardClaimed", { tokenId, staker: resolved, amount: pending });
    return pending;
  }

  async getStakerTokens(stakerId: string): Promise<number[]> {
    await this.delay();
    const resolved = this.world.resolveUserId(stakerId);
    return this.world.stakes.filter((entry) => entry.stakerId === resolved).map((entry) => entry.tokenId);
  }

  async listRental(tokenId: number, ownerId: string, fee: number, durationHours: number): Promise<void> {
    await this.delay();
    const nft = this.world.requireNFT(tokenId);
    const resolved = this.world.resolveUserId(ownerId);
    if (nft.ownerId !== resolved) throw new Error("Not the NFT owner");
    const existing = this.world.rentals.find((entry) => entry.tokenId === tokenId);
    if (existing?.active) throw new Error("Already rented");
    const listing = existing ?? {
      tokenId,
      ownerId: resolved,
      renterId: null,
      fee,
      durationHours,
      listed: true,
      active: false,
      startTime: null,
      endTime: null,
      totalEarned: 0,
    };
    listing.fee = fee;
    listing.durationHours = durationHours;
    listing.listed = true;
    listing.ownerId = resolved;
    if (!existing) this.world.rentals.push(listing);
    this.world.events.emit("RentalListed", { tokenId, owner: resolved, fee, durationHours });
  }

  async rent(tokenId: number, renterId: string): Promise<void> {
    await this.delay();
    const listing = this.world.rentals.find((entry) => entry.tokenId === tokenId);
    if (!listing || !listing.listed) throw new Error("Not listed");
    if (listing.active) throw new Error("Already rented");
    const renter = this.world.resolveUserId(renterId);
    const fee = listing.fee;
    const balance = this.world.getBalance(renter);
    if (balance < fee) throw new Error("Insufficient balance");
    this.world.setBalance(renter, balance - fee);
    this.world.setBalance(listing.ownerId, this.world.getBalance(listing.ownerId) + fee);
    listing.active = true;
    listing.renterId = renter;
    listing.startTime = new Date();
    listing.endTime = new Date(Date.now() + listing.durationHours * 60 * 60 * 1000);
    listing.totalEarned += fee;
    this.world.events.emit("RentalCreated", { tokenId, renter, endTime: listing.endTime });
  }
}
