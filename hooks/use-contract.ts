import { useCallback, useState } from "react";
import { ethers, type InterfaceAbi } from "ethers";

import { useBlockchain } from "@/hooks/use-blockchain";
import { formatContractError } from "@/lib/web3/errors";
import { getReadContract } from "@/lib/web3/rpc";

function isWaitable(value: unknown): value is { wait: () => Promise<unknown> } {
  return Boolean(value && typeof value === "object" && "wait" in value && typeof (value as { wait?: unknown }).wait === "function");
}

export function useContract(contractAddress: string, abi: InterfaceAbi) {
  const { getContract, signer, provider, isConnected, chainId } = useBlockchain();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getWriteContract = useCallback(() => {
    if (!contractAddress) throw new Error("Contract address is not configured.");
    if (!signer) throw new Error("Wallet not connected");
    return getContract(contractAddress, abi);
  }, [abi, contractAddress, getContract, signer]);

  const getReadInstance = useCallback(() => {
    if (!contractAddress) throw new Error("Contract address is not configured.");
    const runner = signer ?? provider;
    if (runner) return new ethers.Contract(contractAddress, abi, runner);
    return getReadContract(contractAddress, abi, chainId ?? undefined);
  }, [abi, chainId, contractAddress, provider, signer]);

  const invoke = useCallback(
    async <T>(
      mode: "read" | "write",
      method: string,
      args: unknown[],
      options?: { captureError?: boolean; trackLoading?: boolean },
    ): Promise<T> => {
      const captureError = options?.captureError ?? true;
      const trackLoading = options?.trackLoading ?? captureError;
      if (trackLoading) setLoading(true);
      if (captureError) setError(null);
      try {
        const contract = mode === "write" ? getWriteContract() : getReadInstance();
        const result = await contract.getFunction(method)(...args);
        if (mode === "write" && isWaitable(result)) {
          const receipt = await result.wait();
          if (receipt == null) {
            throw new Error("Transaction was submitted but confirmation was not returned.");
          }
          return receipt as T;
        }
        return result as T;
      } catch (err: unknown) {
        if (captureError) setError(formatContractError(err));
        throw err;
      } finally {
        if (trackLoading) setLoading(false);
      }
    },
    [getReadInstance, getWriteContract],
  );

  const call = useCallback(
    async <T>(method: string, ...args: unknown[]): Promise<T> => invoke<T>("read", method, args),
    [invoke],
  );

  const callSilent = useCallback(
    async <T>(method: string, ...args: unknown[]): Promise<T> =>
      invoke<T>("read", method, args, { captureError: false, trackLoading: false }),
    [invoke],
  );

  const send = useCallback(
    async <T>(method: string, ...args: unknown[]): Promise<T> => invoke<T>("write", method, args),
    [invoke],
  );

  return {
    call,
    callSilent,
    send,
    loading,
    error,
    isConnected,
    contractAddress,
  };
}
