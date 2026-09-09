import { MOCK_CONFIG, sampleDelayMs, sleep } from "@/lib/mock/config";
import type { MockEventHandler } from "@/lib/mock/emitter";
import { DEFAULT_MOCK_SEED } from "@/lib/mock/seed";
import type { IMockBlockchain } from "@/lib/mock/services/IMockBlockchain";
import { MockBlockchain, type MockBlockchainOptions } from "@/lib/mock/services/MockBlockchain";

/**
 * Async facade that wraps every mock-chain call with simulated network latency
 * and delayed match resolution so the demo feels like a live RPC.
 */
export class MockBlockchainAsync implements IMockBlockchain {
  private readonly mock: MockBlockchain;

  constructor(seedOrService: number | MockBlockchain = DEFAULT_MOCK_SEED, options: MockBlockchainOptions = {}) {
    this.mock =
      seedOrService instanceof MockBlockchain
        ? seedOrService
        : new MockBlockchain(seedOrService, { ...options, latencyMs: 0 });
  }

  get inner(): MockBlockchain {
    return this.mock;
  }

  private async wait(ms?: number): Promise<void> {
    await sleep(ms ?? sampleDelayMs(MOCK_CONFIG.minDelayMs, MOCK_CONFIG.maxDelayMs));
  }

  async getCurrentUser() {
    await this.wait();
    return this.mock.getCurrentUser();
  }

  async setCurrentUser(id: string) {
    await this.wait();
    return this.mock.setCurrentUser(id);
  }

  async getUser(id: string) {
    await this.wait();
    return this.mock.getUser(id);
  }

  async getAllUsers() {
    await this.wait();
    return this.mock.getAllUsers();
  }

  async getNFTs(ownerId?: string) {
    await this.wait();
    return this.mock.getNFTs(ownerId);
  }

  async getNFT(id: number) {
    await this.wait();
    return this.mock.getNFT(id);
  }

  async mintNFT(ownerId: string, rarity: string) {
    await this.wait();
    return this.mock.mintNFT(ownerId, rarity);
  }

  async stakeNFT(id: number, userId: string) {
    await this.wait();
    return this.mock.stakeNFT(id, userId);
  }

  async unstakeNFT(id: number, userId: string) {
    await this.wait();
    return this.mock.unstakeNFT(id, userId);
  }

  async evolveNFT(id: number, userId: string) {
    await this.wait();
    return this.mock.evolveNFT(id, userId);
  }

  async transferNFT(from: string, to: string, tokenId: number) {
    await this.wait();
    return this.mock.transferNFT(from, to, tokenId);
  }

  async getMatches() {
    await this.wait();
    return this.mock.getMatches();
  }

  async getMatch(id: string) {
    await this.wait();
    return this.mock.getMatch(id);
  }

  async createMatch(playerIds: string[]) {
    await this.wait(MOCK_CONFIG.matchCreationDelayMs);
    const match = await this.mock.createMatch(playerIds);
    setTimeout(() => {
      this.mock.world.events.emit("MatchResolved", match);
    }, MOCK_CONFIG.matchResolveDelayMs);
    return match;
  }

  async getLeaderboard() {
    await this.wait();
    return this.mock.getLeaderboard();
  }

  async getFriends(userId: string) {
    await this.wait();
    return this.mock.getFriends(userId);
  }

  async getGuilds() {
    await this.wait();
    return this.mock.getGuilds();
  }

  async getGuild(id: string) {
    await this.wait();
    return this.mock.getGuild(id);
  }

  async joinGuild(guildId: string, userId: string) {
    await this.wait();
    return this.mock.joinGuild(guildId, userId);
  }

  async leaveGuild(guildId: string, userId: string) {
    await this.wait();
    return this.mock.leaveGuild(guildId, userId);
  }

  async getReferrals(userId?: string) {
    await this.wait();
    return this.mock.getReferrals(userId);
  }

  async getQuests() {
    await this.wait();
    return this.mock.getQuests();
  }

  async acceptQuest(questId: string, userId: string) {
    await this.wait();
    return this.mock.acceptQuest(questId, userId);
  }

  async progressQuest(questId: string, userId: string, increment: number) {
    await this.wait();
    return this.mock.progressQuest(questId, userId, increment);
  }

  async claimQuest(questId: string, userId: string) {
    await this.wait();
    return this.mock.claimQuest(questId, userId);
  }

  async getAchievements() {
    await this.wait();
    return this.mock.getAchievements();
  }

  async unlockAchievement(achievementId: string, userId: string) {
    await this.wait();
    return this.mock.unlockAchievement(achievementId, userId);
  }

  async getFactions() {
    await this.wait();
    return this.mock.getFactions();
  }

  async joinFaction(factionId: string, userId: string) {
    await this.wait();
    return this.mock.joinFaction(factionId, userId);
  }

  async getPredictions() {
    await this.wait();
    return this.mock.getPredictions();
  }

  async placePrediction(predictionId: string, userId: string, outcome: "yes" | "no", amount: number) {
    await this.wait();
    return this.mock.placePrediction(predictionId, userId, outcome, amount);
  }

  async getBalance(userId: string) {
    await this.wait();
    return this.mock.getBalance(userId);
  }

  async transferTokens(from: string, to: string, amount: number) {
    await this.wait();
    return this.mock.transferTokens(from, to, amount);
  }

  async getRewardPools() {
    await this.wait();
    return this.mock.getRewardPools();
  }

  async getStakePositions(userId?: string) {
    await this.wait();
    return this.mock.getStakePositions(userId);
  }

  async getPendingReward(tokenId: number) {
    await this.wait();
    return this.mock.getPendingReward(tokenId);
  }

  async claimStakeReward(tokenId: number, userId: string) {
    await this.wait();
    return this.mock.claimStakeReward(tokenId, userId);
  }

  async getRentals() {
    await this.wait();
    return this.mock.getRentals();
  }

  async listRental(tokenId: number, ownerId: string, fee: number, durationHours: number) {
    await this.wait();
    return this.mock.listRental(tokenId, ownerId, fee, durationHours);
  }

  async rentNFT(tokenId: number, renterId: string) {
    await this.wait();
    return this.mock.rentNFT(tokenId, renterId);
  }

  on(eventName: string, callback: MockEventHandler): void {
    this.mock.on(eventName, callback);
  }

  off(eventName: string, callback: MockEventHandler): void {
    this.mock.off(eventName, callback);
  }
}
