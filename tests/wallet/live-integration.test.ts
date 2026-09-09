import { describe, expect, it } from "vitest";

import { shouldUseMockFallback } from "../../lib/mock/fallback";
import { FZONE_ENTRY_FEE, ZERO_ADDRESS, isLiveContractAddress } from "../../lib/web3/addresses";
import { DEFAULT_CHAIN_ID, getExplorerTxUrl, getGameContractAddress, getTokenContractAddress } from "../../lib/web3/config";
import { formatContractError, isConfigurationError, isContractRevert, isPendingRequest, isUserRejected, toUserFacingError } from "../../lib/web3/errors";
import { requireLiveContracts, resolveLiveContracts } from "../../lib/web3/live";
import { asTokenAmount, needsTokenApproval, parseEtherAmount } from "../../lib/web3/token";

describe("live contract fallback and errors", () => {
  it("does not treat user rejection or reverts as a demo fallback", () => {
    expect(isUserRejected({ code: 4001 })).toBe(true);
    expect(isUserRejected({ code: "ACTION_REJECTED" })).toBe(true);
    expect(isUserRejected(new Error("Transaction was rejected in MetaMask."))).toBe(true);
    expect(isContractRevert({ code: "CALL_EXCEPTION", shortMessage: "execution reverted" })).toBe(true);
    expect(isContractRevert({ reason: "ERC20: insufficient allowance" })).toBe(true);
    expect(shouldUseMockFallback({ code: 4001 })).toBe(false);
    expect(shouldUseMockFallback({ code: "CALL_EXCEPTION", shortMessage: "execution reverted" })).toBe(false);
    expect(shouldUseMockFallback(new Error("Game contract address is not configured for this network."))).toBe(false);
    expect(shouldUseMockFallback({ code: -32002 })).toBe(false);
    expect(shouldUseMockFallback(new Error("transaction timed out"))).toBe(false);
    expect(shouldUseMockFallback(new Error("failed to fetch"))).toBe(true);
  });

  it("maps arena custom errors to player-readable copy", () => {
    expect(formatContractError({ revert: { name: "InvalidName" } })).toBe("Display name must be 2–20 characters.");
    expect(formatContractError({ code: 4001 })).toBe("Transaction was rejected in MetaMask.");
    expect(formatContractError({ code: -32002 })).toBe("A MetaMask request is already pending. Open MetaMask to continue.");
    expect(formatContractError({ shortMessage: "ERC20: insufficient allowance" })).toBe("Approve FZONE before joining a staked match.");
    expect(formatContractError({ shortMessage: "nonce too low" })).toBe("That transaction was already sent. Check the lobby before retrying.");
    expect(formatContractError({ shortMessage: "replacement transaction underpriced" })).toBe(
      "A previous transaction is still pending. Wait or speed it up in MetaMask.",
    );
    expect(formatContractError(new Error("failed to fetch"))).toBe("Could not reach the network. Check your connection and retry.");
    expect(formatContractError(new Error("circuit breaker is open"))).toBe("The RPC is busy. Wait a moment, then retry.");
    expect(formatContractError({ code: "INSUFFICIENT_FUNDS" })).toBe("Not enough POL to cover gas for this transaction.");
    expect(isConfigurationError(new Error("Connect MetaMask to use on-chain matches."))).toBe(true);
    expect(isPendingRequest({ code: -32002 })).toBe(true);
  });

  it("classifies nested ethers errors and keeps formatted errors fallback-safe", () => {
    const nestedReject = { code: "UNKNOWN_ERROR", error: { code: 4001, message: "User denied transaction signature." } };
    expect(isUserRejected(nestedReject)).toBe(true);
    expect(shouldUseMockFallback(nestedReject)).toBe(false);
    expect(formatContractError(nestedReject)).toBe("Transaction was rejected in MetaMask.");

    const nestedRevert = {
      code: "UNKNOWN_ERROR",
      info: { error: { message: "execution reverted: InvalidName" } },
      revert: { name: "InvalidName" },
    };
    expect(isContractRevert(nestedRevert)).toBe(true);
    expect(formatContractError(nestedRevert)).toBe("Display name must be 2–20 characters.");

    const wrapped = toUserFacingError({ code: "CALL_EXCEPTION", revert: { name: "AlreadyInMatch" } });
    expect(wrapped.message).toBe("This wallet is already in the lobby.");
    expect(shouldUseMockFallback(wrapped)).toBe(false);
    expect(isContractRevert(wrapped)).toBe(true);
  });

  it("requires a FZONE approval when allowance is below the entry fee", () => {
    expect(needsTokenApproval(0n)).toBe(true);
    expect(needsTokenApproval(FZONE_ENTRY_FEE - 1n)).toBe(true);
    expect(needsTokenApproval(FZONE_ENTRY_FEE)).toBe(false);
    expect(asTokenAmount(10n * 10n ** 18n)).toBe(FZONE_ENTRY_FEE);
    expect(asTokenAmount("not-a-number")).toBe(0n);
    expect(parseEtherAmount("10.0")).toBe(FZONE_ENTRY_FEE);
    expect(parseEtherAmount("not-ether")).toBe(0n);
  });

  it("requireLiveContracts switches network before treating empty addresses as unconfigured", async () => {
    const switched: number[] = [];
    await expect(
      requireLiveContracts(
        { isConnected: false, connectionMode: null, ensureNetwork: async () => {} },
        { game: true, token: true },
      ),
    ).rejects.toThrow("Connect MetaMask to use on-chain matches.");
    await expect(
      requireLiveContracts(
        {
          isConnected: true,
          connectionMode: "live",
          ensureNetwork: async (chainId) => {
            if (chainId != null) switched.push(chainId);
          },
        },
        { game: true, token: true },
      ),
    ).rejects.toThrow("Game contract address is not configured for this network.");
    expect(switched).toEqual([DEFAULT_CHAIN_ID]);
    await expect(
      requireLiveContracts(
        { isConnected: true, connectionMode: "demo", ensureNetwork: async () => {} },
        { reputation: true },
      ),
    ).rejects.toThrow("Connect MetaMask to use on-chain reputation.");
  });

  it("treats zero addresses as unconfigured even on a live wallet", () => {
    expect(isLiveContractAddress(ZERO_ADDRESS)).toBe(false);
    expect(getGameContractAddress(80002)).toBe("");
    expect(getTokenContractAddress(80002)).toBe("");
    expect(
      resolveLiveContracts({ isConnected: true, connectionMode: "live", chainId: 80002 }).canUseLiveGame,
    ).toBe(false);
    expect(
      resolveLiveContracts({ isConnected: true, connectionMode: "demo", chainId: 80002 }).isLiveWallet,
    ).toBe(false);
  });

  it("builds explorer URLs only for real transaction hashes", () => {
    expect(getExplorerTxUrl(80002, "demo_match_1")).toBeNull();
    expect(getExplorerTxUrl(80002, "0x1234")).toBeNull();
    expect(getExplorerTxUrl(80002, `0x${"ab".repeat(32)}`)).toBe("https://amoy.polygonscan.com/tx/0xabababababababababababababababababababababababababababababababab");
  });
});
