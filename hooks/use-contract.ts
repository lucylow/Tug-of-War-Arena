import { useCallback, useState } from "react";
import type { InterfaceAbi } from "ethers";

import { useBlockchain } from "@/hooks/use-blockchain";

export function useContract(contractAddress: string, abi: InterfaceAbi) {
  const { getContract, signer, isConnected } = useBlockchain();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getContractInstance = useCallback(() => {
    if (!signer) throw new Error("Wallet not connected");
    return getContract(contractAddress, abi);
  }, [abi, contractAddress, getContract, signer]);

  const call = useCallback(
    async <T>(method: string, ...args: unknown[]): Promise<T> => {
      setLoading(true);
      setError(null);
      try {
        const contract = getContractInstance();
        const fn = contract.getFunction(method);
        return (await fn(...args)) as T;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : `Failed to call ${method}`;
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getContractInstance],
  );

  const send = useCallback(
    async <T>(method: string, ...args: unknown[]): Promise<T> => {
      setLoading(true);
      setError(null);
      try {
        const contract = getContractInstance();
        const fn = contract.getFunction(method);
        const tx = await fn(...args);
        if (tx && typeof tx === "object" && "wait" in tx && typeof tx.wait === "function") {
          return (await tx.wait()) as T;
        }
        return tx as T;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : `Failed to send ${method}`;
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getContractInstance],
  );

  return {
    call,
    send,
    loading,
    error,
    isConnected,
    contractAddress,
  };
}
