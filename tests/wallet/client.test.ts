import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("react-native", () => ({
  Linking: {
    openURL: vi.fn(async () => undefined),
    canOpenURL: vi.fn(async () => false),
  },
  Platform: { OS: "web" },
}));

vi.mock("@metamask/connect-evm", () => ({
  createEVMClient: vi.fn(async () => ({
    connect: vi.fn(async () => {
      throw new Error("Failed to connect to MetaMask");
    }),
    disconnect: vi.fn(async () => undefined),
    getProvider: vi.fn(() => ({
      request: vi.fn(async () => []),
    })),
  })),
}));

import { connectLiveSession, requestWallet, resetMetaMaskClientForTests } from "../../lib/web3/client";
import { formatWalletError, formatWalletErrorTitle, shouldFallbackToDemo } from "../../lib/web3/errors";

function setEthereum(value: unknown) {
  (globalThis as { ethereum?: unknown }).ethereum = value;
}

describe("live MetaMask connection", () => {
  beforeEach(() => {
    resetMetaMaskClientForTests();
    delete (globalThis as { ethereum?: unknown }).ethereum;
  });

  afterEach(() => {
    resetMetaMaskClientForTests();
    delete (globalThis as { ethereum?: unknown }).ethereum;
    vi.useRealTimers();
  });

  it("connects with eth_requestAccounts when MetaMask is already injected", async () => {
    const request = vi.fn(async ({ method }: { method: string }) => {
      if (method === "eth_requestAccounts") return ["0xabc"];
      if (method === "eth_chainId") return "0x13882";
      throw new Error(`unexpected ${method}`);
    });
    setEthereum({ request, isMetaMask: true });

    const live = await connectLiveSession("0x13882");
    expect(live.accounts).toEqual(["0xabc"]);
    expect(live.chainId).toBe("0x13882");
    expect(request).toHaveBeenCalledWith({ method: "eth_requestAccounts" });
    expect(request).not.toHaveBeenCalledWith(expect.objectContaining({ method: "wallet_createSession" }));
  });

  it("turns a synchronous inpage connect throw into a user-facing wallet error", async () => {
    setEthereum({
      isMetaMask: true,
      request: () => {
        throw new Error("Failed to connect to MetaMask");
      },
    });

    await expect(connectLiveSession()).rejects.toThrow(
      "MetaMask could not connect. Unlock the extension, approve this site if prompted, then try again.",
    );
    expect(shouldFallbackToDemo(new Error("Failed to connect to MetaMask"))).toBe(false);
  });

  it("falls back to demo in auto-mode only when MetaMask is not injected", async () => {
    expect(shouldFallbackToDemo(new Error("Failed to connect to MetaMask"))).toBe(true);
    await expect(connectLiveSession()).rejects.toThrow(
      "MetaMask could not connect. Unlock the extension, approve this site if prompted, then try again.",
    );
  });

  it("maps empty accounts to an unlock/select-account error", async () => {
    setEthereum({
      isMetaMask: true,
      request: async ({ method }: { method: string }) => {
        if (method === "eth_requestAccounts") return [];
        return "0x13882";
      },
    });
    await expect(connectLiveSession()).rejects.toThrow("No MetaMask account was returned");
  });

  it("times out a hung MetaMask request", async () => {
    vi.useFakeTimers();
    const provider = { request: () => new Promise(() => undefined) };
    const pending = requestWallet(provider, { method: "eth_requestAccounts" }, 25);
    const expectation = expect(pending).rejects.toThrow("MetaMask did not respond");
    await vi.advanceTimersByTimeAsync(25);
    await expectation;
  });
});

describe("wallet error copy", () => {
  it("titles connection failures by kind", () => {
    expect(formatWalletErrorTitle({ code: 4001 })).toBe("Connection Cancelled");
    expect(formatWalletErrorTitle({ code: -32002 })).toBe("MetaMask Is Waiting");
    expect(formatWalletErrorTitle(new Error("MetaMask is locked"))).toBe("Unlock MetaMask");
    expect(formatWalletErrorTitle(new Error("Failed to connect to MetaMask"))).toBe("Connection Failed");
    expect(formatWalletError({ code: 4900 })).toBe("MetaMask disconnected. Open the extension and connect again.");
  });
});
