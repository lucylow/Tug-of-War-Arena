import { afterEach, describe, expect, it } from "vitest";

import { BrowserWalletAdapter } from "../../lib/blockchain/wallet/browserAdapter";
import { DemoWalletAdapter } from "../../lib/blockchain/wallet/demoAdapter";
import { MobileWalletAdapter } from "../../lib/blockchain/wallet/mobileAdapter";
import { WalletManager } from "../../lib/blockchain/wallet/manager";
import { normalizeWalletError, shouldAutoFallbackToDemo } from "../../lib/blockchain/wallet/errors";
import { DEMO_WALLET_ADDRESS } from "../../lib/blockchain/wallet/types";
import { setRuntimeKindForTests } from "../../lib/runtime/runtime";

function setEthereum(value: unknown) {
  (globalThis as { ethereum?: unknown }).ethereum = value;
}

describe("wallet adapter matrix", () => {
  afterEach(() => {
    delete (globalThis as { ethereum?: unknown }).ethereum;
    setRuntimeKindForTests(null);
    WalletManager.resetForTests();
  });

  it("returns no provider when ethereum is missing", async () => {
    setRuntimeKindForTests("browser");
    setEthereum(undefined);
    const adapter = new BrowserWalletAdapter();
    expect(await adapter.isAvailable()).toBe(false);
    await expect(adapter.connect()).rejects.toMatchObject({ code: "NO_PROVIDER" });
  });

  it("connects when a request() provider is available", async () => {
    setRuntimeKindForTests("browser");
    setEthereum({
      isMetaMask: true,
      request: async ({ method }: { method: string }) => {
        if (method === "eth_requestAccounts") return ["0xabc"];
        if (method === "eth_chainId") return "0x13882";
        return null;
      },
    });
    const session = await new BrowserWalletAdapter().connect();
    expect(session.address).toBe("0xabc");
    expect(session.isDemo).toBe(false);
    expect(session.provider).toBe("metamask");
  });

  it("normalizes user rejection", () => {
    const normalized = normalizeWalletError({ code: 4001 });
    expect(normalized.code).toBe("USER_REJECTED");
    expect(normalized.message).toBe("Wallet connection canceled.");
  });

  it("does not auto-fallback on rejection, pending, or missing-network requests", () => {
    expect(shouldAutoFallbackToDemo({ code: 4001 }, true)).toBe(false);
    expect(shouldAutoFallbackToDemo({ code: -32002 }, true)).toBe(false);
    expect(shouldAutoFallbackToDemo({ code: 4902 }, true)).toBe(false);
  });

  it("marks unsupported native runtime as unavailable instead of faking success", async () => {
    setRuntimeKindForTests("react-native-ios");
    const mobile = new MobileWalletAdapter();
    expect(await mobile.isAvailable()).toBe(false);
    await expect(mobile.connect()).rejects.toMatchObject({ code: "PROVIDER_UNAVAILABLE" });
  });

  it("never reads injected ethereum on native runtimes", async () => {
    setRuntimeKindForTests("react-native-android");
    setEthereum({ request: async () => ["0xabc"], isMetaMask: true });
    expect(await new BrowserWalletAdapter().isAvailable()).toBe(false);
  });

  it("connects a labeled demo wallet", async () => {
    const session = await new DemoWalletAdapter().connect();
    expect(session.isDemo).toBe(true);
    expect(session.address).toBe(DEMO_WALLET_ADDRESS);
    expect(await new DemoWalletAdapter().signMessage("proof")).toBe("DEMO_SIGNATURE");
  });

  it("dedupes overlapping connect taps", async () => {
    setRuntimeKindForTests("browser");
    let calls = 0;
    setEthereum({
      isMetaMask: true,
      request: async ({ method }: { method: string }) => {
        if (method === "eth_requestAccounts") {
          calls += 1;
          await new Promise((resolve) => setTimeout(resolve, 20));
          return ["0xabc"];
        }
        return "0x13882";
      },
    });
    const adapter = new BrowserWalletAdapter();
    const [first, second] = await Promise.all([adapter.connect(), adapter.connect()]);
    expect(first.address).toBe(second.address);
    expect(calls).toBe(1);
  });

  it("strips extension URLs from user-facing errors", () => {
    const normalized = normalizeWalletError(
      new Error("Failed to connect to MetaMask chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/scripts/inpage.js"),
    );
    expect(normalized.message).toBe("Wallet connection failed.");
    expect(normalized.message).not.toContain("chrome-extension://");
  });
});
