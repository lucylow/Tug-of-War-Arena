import { useCallback } from "react";

import { useBlockchain } from "@/hooks/use-blockchain";
import { useContract } from "@/hooks/use-contract";
import { runLiveOrMock } from "@/lib/mock/fallback";
import type { MockUser } from "@/lib/mock/generators";
import { SOCIAL_REPUTATION_ABI } from "@/lib/web3/abi";
import { isLiveContractAddress } from "@/lib/web3/addresses";
import { toUserFacingError } from "@/lib/web3/errors";
import { requireLiveContracts, resolveLiveContracts } from "@/lib/web3/live";

export type OnChainReputation = {
  score: number;
  trustLevel: number;
  interactions: number;
  positiveFeedback: number;
  negativeFeedback: number;
  lastActive: number;
  followers: number;
  following: number;
  isVerified: boolean;
  metadata: string;
};

const REPUTATION_FIELDS = [
  "score",
  "trustLevel",
  "interactions",
  "positiveFeedback",
  "negativeFeedback",
  "lastActive",
  "followers",
  "following",
  "isVerified",
  "metadata",
] as const;

function readBig(value: unknown): number {
  if (typeof value === "bigint") {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  }
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  }
  return 0;
}

function decodeReputation(data: unknown): OnChainReputation {
  if (data == null) throw new Error("Invalid reputation payload");
  const record = Array.isArray(data)
    ? Object.fromEntries(REPUTATION_FIELDS.map((key, index) => [key, data[index]]))
    : (data as Record<string, unknown> | null);
  if (!record || typeof record !== "object") throw new Error("Invalid reputation payload");
  return {
    score: readBig(record.score),
    trustLevel: readBig(record.trustLevel),
    interactions: readBig(record.interactions),
    positiveFeedback: readBig(record.positiveFeedback),
    negativeFeedback: readBig(record.negativeFeedback),
    lastActive: readBig(record.lastActive),
    followers: readBig(record.followers),
    following: readBig(record.following),
    isVerified: Boolean(record.isVerified),
    metadata: String(record.metadata ?? ""),
  };
}

function fromMockProfile(profile: MockUser): OnChainReputation {
  return {
    score: profile.reputation,
    trustLevel: profile.isVerified ? 3 : 1,
    interactions: profile.matchesPlayed,
    positiveFeedback: profile.wins,
    negativeFeedback: profile.losses,
    lastActive: Math.floor(profile.lastActive.getTime() / 1000),
    followers: Math.max(1, Math.floor(profile.reputation / 10)),
    following: Math.max(1, Math.floor(profile.level / 2)),
    isVerified: profile.isVerified,
    metadata: JSON.stringify({ name: profile.displayName, avatar: profile.avatarUrl, fallback: true }),
  };
}

export function useSocialReputation() {
  const { isConnected, connectionMode, ensureCorrectNetwork, mockService, chainId } = useBlockchain();
  const live = resolveLiveContracts({ isConnected, connectionMode, chainId });
  const address = live.reputationAddress;
  const { call, send, loading, error } = useContract(address, SOCIAL_REPUTATION_ABI);

  const requireLiveWallet = useCallback(
    () =>
      requireLiveContracts(
        { isConnected, connectionMode, ensureNetwork: ensureCorrectNetwork },
        { reputation: true },
      ),
    [connectionMode, ensureCorrectNetwork, isConnected],
  );

  const write = useCallback(
    async (method: string, ...args: unknown[]) => {
      try {
        await requireLiveWallet();
        return await send(method, ...args);
      } catch (error) {
        throw toUserFacingError(error);
      }
    },
    [requireLiveWallet, send],
  );

  const follow = useCallback((target: string) => write("follow", target), [write]);
  const unfollow = useCallback((target: string) => write("unfollow", target), [write]);
  const updateProfile = useCallback(
    (name: string, avatar: string) => write("setMetadata", JSON.stringify({ name, avatar })),
    [write],
  );

  const getProfile = useCallback(
    async (user: string): Promise<OnChainReputation> => {
      const { value } = await runLiveOrMock({
        enabled: live.canUseLiveReputation,
        live: async () => {
          await requireLiveWallet();
          return decodeReputation(await call("getReputation", user));
        },
        mock: async (mock) => fromMockProfile((await mock.getUser(user)) ?? (await mock.getCurrentUser())),
        mockService,
        reason: isLiveContractAddress(address) ? "live-unavailable" : "unconfigured-contract",
      });
      return value;
    },
    [address, call, live.canUseLiveReputation, mockService, requireLiveWallet],
  );

  return { follow, unfollow, updateProfile, getProfile, loading, error, isConfigured: Boolean(address) };
}
