import { SeededRandom } from "@/lib/mock/seed";

export type Rarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary" | "Mythic";

export const RARITIES: readonly Rarity[] = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic"];

export const RARITY_WEIGHTS: Record<Rarity, number> = {
  Common: 50,
  Uncommon: 25,
  Rare: 15,
  Epic: 7,
  Legendary: 2.5,
  Mythic: 0.5,
};

export const RARITY_COLORS: Record<Rarity, string> = {
  Common: "#808080",
  Uncommon: "#008000",
  Rare: "#0000FF",
  Epic: "#800080",
  Legendary: "#FF8C00",
  Mythic: "#FF0000",
};

export const RARITY_POWER: Record<Rarity, number> = {
  Common: 5,
  Uncommon: 10,
  Rare: 20,
  Epic: 35,
  Legendary: 50,
  Mythic: 100,
};

export const RARITY_SPEED: Record<Rarity, number> = {
  Common: 2,
  Uncommon: 4,
  Rare: 8,
  Epic: 15,
  Legendary: 25,
  Mythic: 50,
};

export interface MockNFT {
  id: number;
  ownerId: string;
  rarity: Rarity;
  powerBonus: number;
  speedBonus: number;
  staked: boolean;
  evolved: boolean;
  level: number;
  mintedAt: Date;
  metadataURI: string;
}

export function isRarity(value: string): value is Rarity {
  return (RARITIES as readonly string[]).includes(value);
}

export function generateNFTs(totalCount: number, ownerIds: string[], random: SeededRandom): MockNFT[] {
  const nfts: MockNFT[] = [];
  const weights = RARITIES.map((rarity) => RARITY_WEIGHTS[rarity]);
  const fallbackOwner = ownerIds[0] ?? "user_0";

  for (let i = 0; i < totalCount; i += 1) {
    const rarity = random.weightedPick(RARITIES, weights);
    nfts.push({
      id: i,
      ownerId: ownerIds.length > 0 ? random.pick(ownerIds) : fallbackOwner,
      rarity,
      powerBonus: RARITY_POWER[rarity],
      speedBonus: RARITY_SPEED[rarity],
      staked: random.nextInt(0, 100) < 30,
      evolved: random.nextInt(0, 100) < 20,
      level: random.nextInt(1, 5),
      mintedAt: new Date(Date.now() - random.nextInt(0, 30) * 24 * 60 * 60 * 1000),
      metadataURI: `ipfs://Qm${random.nextInt(1000, 9999)}`,
    });
  }
  return nfts;
}
