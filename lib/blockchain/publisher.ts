import { FEATURES } from "@/lib/config/features";
import { getExplorerTxUrl } from "@/lib/web3/config";
import { createMatchProof, type MatchProofInput } from "./matchProof";

export type PublishedProof = {
  id: string;
  hash: string;
  signature: string;
  isDemo: boolean;
  explorerUrl: string | null;
};

const proofs = new Map<string, PublishedProof>();

export class BlockchainPublisher {
  publishMatchProof(input: MatchProofInput, options?: { signature?: string | null; signedBy?: string | null; isDemo?: boolean; chainId?: number | null }): PublishedProof {
    const created = createMatchProof(input, options);
    const live = FEATURES.LIVE_BLOCKCHAIN_WRITES && !created.isDemo;
    const published: PublishedProof = {
      id: input.matchId,
      hash: created.hash,
      signature: created.signature,
      isDemo: !live,
      explorerUrl: live ? getExplorerTxUrl(options?.chainId ?? null, created.hash.padEnd(66, "0").slice(0, 66)) : null,
    };
    proofs.set(input.matchId, published);
    return published;
  }

  getProof(matchId: string): PublishedProof | null {
    return proofs.get(matchId) ?? null;
  }

  getExplorerUrl(matchId: string): string | null {
    return this.getProof(matchId)?.explorerUrl ?? null;
  }
}

export function resetPublisherForTests(): void {
  proofs.clear();
}
