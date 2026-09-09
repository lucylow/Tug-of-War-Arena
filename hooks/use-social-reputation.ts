import { useCallback } from "react";

import { useBlockchain } from "@/hooks/use-blockchain";
import { useContract } from "@/hooks/use-contract";
import { SOCIAL_REPUTATION_ABI } from "@/lib/web3/abi";
import { DEFAULT_CHAIN_ID, getSocialReputationAddress } from "@/lib/web3/config";

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

function readBig(value: unknown): number {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
}

export function useSocialReputation() {
  const { isConnected, connectionMode, ensureCorrectNetwork } = useBlockchain();
  const address = getSocialReputationAddress();
  const { call, send, loading, error } = useContract(address, SOCIAL_REPUTATION_ABI);

  const requireLiveWallet = useCallback(async () => {
    if (!isConnected || connectionMode !== "live") {
      throw new Error("Connect MetaMask to use on-chain reputation.");
    }
    if (!address) {
      throw new Error("Social reputation contract is not configured.");
    }
    await ensureCorrectNetwork(DEFAULT_CHAIN_ID);
  }, [address, connectionMode, ensureCorrectNetwork, isConnected]);

  const follow = useCallback(
    async (target: string) => {
      await requireLiveWallet();
      return send("follow", target);
    },
    [requireLiveWallet, send],
  );

  const unfollow = useCallback(
    async (target: string) => {
      await requireLiveWallet();
      return send("unfollow", target);
    },
    [requireLiveWallet, send],
  );

  const updateProfile = useCallback(
    async (name: string, avatar: string) => {
      await requireLiveWallet();
      return send("setMetadata", JSON.stringify({ name, avatar }));
    },
    [requireLiveWallet, send],
  );

  const getProfile = useCallback(
    async (user: string): Promise<OnChainReputation> => {
      await requireLiveWallet();
      const data = (await call("getReputation", user)) as Record<string, unknown> | unknown[];
      const record = Array.isArray(data)
        ? {
            score: data[0],
            trustLevel: data[1],
            interactions: data[2],
            positiveFeedback: data[3],
            negativeFeedback: data[4],
            lastActive: data[5],
            followers: data[6],
            following: data[7],
            isVerified: data[8],
            metadata: data[9],
          }
        : data;
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
    },
    [call, requireLiveWallet],
  );

  return { follow, unfollow, updateProfile, getProfile, loading, error, isConfigured: Boolean(address) };
}
