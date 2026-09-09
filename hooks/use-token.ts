import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";

import { useBlockchain } from "@/hooks/use-blockchain";
import { FZONE_ENTRY_FEE } from "@/lib/web3/addresses";
import { formatContractError, toUserFacingError } from "@/lib/web3/errors";
import { resolveLiveContracts } from "@/lib/web3/live";
import { ensureTokenAllowance, needsTokenApproval, parseEtherAmount, readTokenAllowance, readTokenBalance } from "@/lib/web3/token";

export function useToken() {
  const { account, chainId, connectionMode, isConnected, provider, signer, mockService } = useBlockchain();
  const live = resolveLiveContracts({ isConnected, connectionMode, chainId });
  const [balance, setBalance] = useState<string>("0");
  const [allowance, setAllowance] = useState<string>("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!account) {
      setBalance("0");
      setAllowance("0");
      setError(null);
      return;
    }
    if (!live.isLiveWallet || !provider || !live.tokenAddress) {
      if (!mockService) {
        setBalance("0");
        setAllowance("0");
        return;
      }
      try {
        const mockBalance = await mockService.getBalance(account);
        setBalance(String(mockBalance));
        setAllowance(String(mockBalance));
        setError(null);
      } catch (caught) {
        setBalance("0");
        setAllowance("0");
        setError(formatContractError(caught));
      }
      return;
    }
    setLoading(true);
    try {
      const [nextBalance, nextAllowance] = await Promise.all([
        readTokenBalance(provider, live.tokenAddress, account),
        live.gameAddress ? readTokenAllowance(provider, live.tokenAddress, account, live.gameAddress) : Promise.resolve(0n),
      ]);
      setBalance(ethers.formatEther(nextBalance));
      setAllowance(ethers.formatEther(nextAllowance));
      setError(null);
    } catch (caught) {
      setBalance("0");
      setAllowance("0");
      setError(formatContractError(caught));
    } finally {
      setLoading(false);
    }
  }, [account, live.gameAddress, live.isLiveWallet, live.tokenAddress, mockService, provider]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const approveEntryFee = useCallback(async () => {
    if (!signer || !live.tokenAddress || !live.gameAddress) {
      throw new Error("Connect MetaMask on a configured network to approve FZONE.");
    }
    try {
      const result = await ensureTokenAllowance({
        signer,
        tokenAddress: live.tokenAddress,
        spender: live.gameAddress,
        amount: FZONE_ENTRY_FEE,
      });
      await refresh();
      return result;
    } catch (caught) {
      throw toUserFacingError(caught);
    }
  }, [live.gameAddress, live.tokenAddress, refresh, signer]);

  return {
    tokenAddress: live.tokenAddress,
    gameAddress: live.gameAddress,
    balance,
    allowance,
    loading,
    needsApproval: needsTokenApproval(parseEtherAmount(allowance), FZONE_ENTRY_FEE),
    canReadLive: live.isLiveWallet && Boolean(live.tokenAddress),
    error,
    refresh,
    approveEntryFee,
  };
}
