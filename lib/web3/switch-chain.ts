import { addChainParams } from "@/lib/web3/config";
import { getWalletErrorCode, isUserRejected, readErrorMessage } from "@/lib/web3/errors";
import { toHexChainId } from "@/lib/web3/format";
import type { Eip1193Like } from "@/lib/web3/types";

export async function switchEthereumChain(provider: Eip1193Like, targetChainId: number): Promise<void> {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: toHexChainId(targetChainId) }],
    });
  } catch (error) {
    if (isUserRejected(error)) throw error;
    const code = getWalletErrorCode(error);
    const network = addChainParams(targetChainId);
    const unrecognized = /unrecognized chain|added to MetaMask/i.test(readErrorMessage(error));
    if ((code === 4902 || unrecognized) && network) {
      try {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [network],
        });
        return;
      } catch (addError) {
        if (isUserRejected(addError)) throw addError;
        throw Object.assign(new Error("Could not add this network to MetaMask. Add Polygon Amoy manually, then try again."), {
          cause: addError,
        });
      }
    }
    throw error;
  }
}
