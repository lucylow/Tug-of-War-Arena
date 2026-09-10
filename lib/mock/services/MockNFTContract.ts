import { MOCK_CONFIG, sampleDelayMs, sleep } from "@/lib/mock/config";
import {
  isRarity,
  RARITY_POWER,
  RARITY_SPEED,
  RARITIES,
  type MockNFT,
  type Rarity,
} from "@/lib/mock/generators";
import type { MockWorld } from "@/lib/mock/services/MockWorld";

function rarityFromIndex(index: number): Rarity {
  return RARITIES[Math.max(0, Math.min(RARITIES.length - 1, index))] ?? "Common";
}

/**
 * In-memory FriendzoneNFT surface (ownerOf, mint, burn, bonuses).
 */
export class MockNFTContract {
  constructor(
    private readonly world: MockWorld,
    private readonly delayMs: number = 0,
  ) {}

  private async delay(overrideMs?: number): Promise<void> {
    const ms = overrideMs ?? this.delayMs;
    await sleep(ms > 0 ? ms : 0);
  }

  async ownerOf(tokenId: number): Promise<string> {
    await this.delay();
    return this.world.requireNFT(tokenId).ownerId;
  }

  async tokensOfOwner(ownerId: string): Promise<number[]> {
    await this.delay();
    const resolved = this.world.resolveUserId(ownerId);
    return this.world.nfts.filter((nft) => nft.ownerId === resolved).map((nft) => nft.id);
  }

  async getNFT(tokenId: number): Promise<MockNFT | null> {
    await this.delay();
    return this.world.nfts.find((nft) => nft.id === tokenId) ?? null;
  }

  async getNFTs(ownerId?: string): Promise<MockNFT[]> {
    await this.delay();
    if (!ownerId) return this.world.nfts;
    const resolved = this.world.resolveUserId(ownerId);
    return this.world.nfts.filter((nft) => nft.ownerId === resolved);
  }

  async transferFrom(from: string, to: string, tokenId: number): Promise<void> {
    await this.delay();
    const nft = this.world.requireNFT(tokenId);
    const fromId = this.world.resolveUserId(from);
    if (nft.ownerId !== fromId) throw new Error("Not the NFT owner");
    if (nft.staked) throw new Error("Cannot transfer a staked NFT");
    nft.ownerId = this.world.resolveUserId(to);
    this.world.events.emit("Transfer", { from: fromId, to: nft.ownerId, tokenId });
  }

  async mint(to: string, rarity: string | number): Promise<number> {
    const nft = await this.mintNFT(to, rarity);
    return nft.id;
  }

  async mintNFT(to: string, rarity: string | number): Promise<MockNFT> {
    await this.delay();
    const rarityName = typeof rarity === "number" ? rarityFromIndex(rarity) : rarity;
    if (!isRarity(rarityName)) throw new Error(`Unknown rarity: ${rarityName}`);
    const ownerId = this.world.resolveUserId(to);
    const nft: MockNFT = {
      id: this.world.nfts.length,
      ownerId,
      name: `${rarityName} Wearable`,
      rarity: rarityName,
      powerBonus: RARITY_POWER[rarityName],
      speedBonus: RARITY_SPEED[rarityName],
      staked: false,
      evolved: false,
      level: 1,
      mintedAt: new Date(),
      metadataURI: `ipfs://Qm${Date.now().toString(36)}`,
    };
    this.world.nfts.push(nft);
    this.world.events.emit("NFTMinted", { to: ownerId, tokenId: nft.id, rarity: rarityName });
    return nft;
  }

  async burn(tokenId: number): Promise<void> {
    await this.delay();
    const nft = this.world.requireNFT(tokenId);
    if (nft.staked) throw new Error("Cannot burn a staked NFT");
    this.world.nfts = this.world.nfts.filter((entry) => entry.id !== tokenId);
    this.world.events.emit("NFTBurned", { tokenId });
  }

  async getRarity(tokenId: number): Promise<Rarity> {
    await this.delay();
    return this.world.requireNFT(tokenId).rarity;
  }

  async getPowerBonus(tokenId: number): Promise<number> {
    await this.delay();
    return this.world.requireNFT(tokenId).powerBonus;
  }

  async getSpeedBonus(tokenId: number): Promise<number> {
    await this.delay();
    return this.world.requireNFT(tokenId).speedBonus;
  }

  async evolve(tokenId: number, userId: string): Promise<MockNFT> {
    await this.delay();
    const nft = this.world.requireNFT(tokenId);
    if (nft.ownerId !== this.world.resolveUserId(userId)) throw new Error("Invalid NFT or owner");
    nft.evolved = true;
    nft.level += 1;
    nft.powerBonus += 5;
    nft.speedBonus += 2;
    this.world.events.emit("NFTEvolved", { tokenId, newLevel: nft.level });
    return nft;
  }

  /** Demo-only helper used by the async facade when no explicit delay is set. */
  static sampleNetworkDelay(): number {
    return sampleDelayMs(MOCK_CONFIG.minDelayMs, MOCK_CONFIG.maxDelayMs);
  }
}
