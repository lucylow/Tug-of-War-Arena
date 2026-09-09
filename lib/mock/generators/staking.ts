import { SeededRandom } from "@/lib/mock/seed";
import type { MockNFT } from "@/lib/mock/generators/nfts";

export interface RewardPool {
  id: number;
  name: string;
  apyBps: number;
  totalStaked: number;
}

export interface StakePosition {
  tokenId: number;
  stakerId: string;
  poolId: number;
  stakedAt: Date;
  accumulatedReward: number;
  claimedReward: number;
}

export interface MockRental {
  tokenId: number;
  ownerId: string;
  renterId: string | null;
  fee: number;
  durationHours: number;
  listed: boolean;
  active: boolean;
  startTime: Date | null;
  endTime: Date | null;
  totalEarned: number;
}

const POOL_NAMES = ["Sun Pool", "Moon Pool", "Arena Vault", "Guild Reserve"] as const;

export function generateRewardPools(random: SeededRandom): RewardPool[] {
  return POOL_NAMES.map((name, id) => ({
    id,
    name,
    apyBps: random.nextInt(400, 1800),
    totalStaked: 0,
  }));
}

export function generateStakePositions(
  nfts: MockNFT[],
  pools: RewardPool[],
  random: SeededRandom,
): StakePosition[] {
  const positions: StakePosition[] = [];
  if (pools.length === 0) return positions;

  for (const nft of nfts) {
    if (!nft.staked) continue;
    const pool = random.pick(pools);
    const accumulated = random.nextInt(1, 40);
    positions.push({
      tokenId: nft.id,
      stakerId: nft.ownerId,
      poolId: pool.id,
      stakedAt: new Date(Date.now() - random.nextInt(1, 14) * 24 * 60 * 60 * 1000),
      accumulatedReward: accumulated,
      claimedReward: random.nextInt(0, accumulated),
    });
    pool.totalStaked += 1;
  }
  return positions;
}

export function generateRentals(
  count: number,
  nfts: MockNFT[],
  random: SeededRandom,
): MockRental[] {
  const available = nfts.filter((nft) => !nft.staked);
  const rentals: MockRental[] = [];
  const take = Math.min(count, available.length);
  for (let i = 0; i < take; i += 1) {
    const nft = available[i]!;
    const listed = random.nextInt(0, 100) < 70;
    const active = listed && random.nextInt(0, 100) < 40;
    const durationHours = random.nextInt(6, 72);
    const start = active ? new Date(Date.now() - random.nextInt(1, 24) * 60 * 60 * 1000) : null;
    rentals.push({
      tokenId: nft.id,
      ownerId: nft.ownerId,
      renterId: active ? `user_${random.nextInt(0, 99)}` : null,
      fee: random.nextInt(5, 80),
      durationHours,
      listed,
      active,
      startTime: start,
      endTime: start ? new Date(start.getTime() + durationHours * 60 * 60 * 1000) : null,
      totalEarned: active ? random.nextInt(5, 120) : 0,
    });
  }
  return rentals;
}

export function pendingStakeReward(position: StakePosition, now: Date = new Date()): number {
  const hours = Math.max(0, (now.getTime() - position.stakedAt.getTime()) / (60 * 60 * 1000));
  const accrued = Math.floor(hours * 0.4);
  return Math.max(0, position.accumulatedReward + accrued - position.claimedReward);
}
