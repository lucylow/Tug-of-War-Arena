import { describe, expect, it } from "vitest";

import { formatWalletError, shouldFallbackToDemo } from "../../lib/web3/errors";
import { DEMO_ACCOUNT, isDemoAccount, resolveWalletConnectStrategy } from "../../lib/web3/session";

describe("wallet connection strategy", () => {
  it("uses demo when requested or when no live wallet is available", () => {
    expect(resolveWalletConnectStrategy("demo", true)).toBe("demo");
    expect(resolveWalletConnectStrategy("auto", false)).toBe("demo");
    expect(resolveWalletConnectStrategy("auto", true)).toBe("live");
    expect(resolveWalletConnectStrategy("live", false)).toBe("live");
  });

  it("falls back to demo for infrastructure failures but not user rejection", () => {
    expect(shouldFallbackToDemo(new Error("MetaMask is not available on this device."))).toBe(true);
    expect(shouldFallbackToDemo({ code: 4001 })).toBe(false);
    expect(shouldFallbackToDemo({ code: -32002 })).toBe(false);
    expect(shouldFallbackToDemo({ code: "ACTION_REJECTED" })).toBe(false);
    expect(shouldFallbackToDemo({ code: 4100 })).toBe(false);
    expect(shouldFallbackToDemo({ code: 4902 })).toBe(false);
  });

  it("formats wallet errors without leaking stack traces", () => {
    expect(formatWalletError({ code: 4001 })).toBe("Wallet connection canceled.");
    expect(formatWalletError({ error: { code: 4001, message: "User denied" } })).toBe("Wallet connection canceled.");
    expect(formatWalletError({ code: -32002 })).toBe("A MetaMask request is already pending. Open the MetaMask popup to continue.");
    expect(formatWalletError({ code: -32603 })).toBe("MetaMask could not complete that request. Unlock the extension and try again.");
    expect(formatWalletError(new Error("Failed to connect to MetaMask"))).toBe("Wallet connection failed.");
    expect(formatWalletError({ code: 4100 })).toBe(
      "MetaMask has not authorized this site. Open MetaMask, unlock it, and approve the connection.",
    );
    expect(formatWalletError(new Error("boom"))).toBe("boom");
    expect(formatWalletError({})).toBe("Wallet request failed.");
  });

  it("recognizes the local demo account used by the judge walkthrough", () => {
    expect(isDemoAccount(DEMO_ACCOUNT)).toBe(true);
    expect(isDemoAccount(DEMO_ACCOUNT.toLowerCase())).toBe(true);
    expect(isDemoAccount("0x000000000000000000000000000000000000dEaD")).toBe(true);
    expect(isDemoAccount("0x1234567890abcdef1234567890abcdef12345678")).toBe(false);
  });
});
