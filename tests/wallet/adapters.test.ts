import { afterEach, describe, expect, it } from "vitest";

import { DEMO_IDENTITY_ADDRESS, getDemoWalletAdapter, getWalletAdapter, normalizeWalletError } from "../../lib/blockchain";
import { setRuntimeForTests } from "../../lib/runtime";

describe("wallet adapters", () => {
  afterEach(() => {
    setRuntimeForTests(null);
    delete (globalThis as { ethereum?: unknown }).ethereum;
  });

  it("uses the demo adapter without generating a private key", async () => {
    setRuntimeForTests("server");
    const adapter = getWalletAdapter();
    expect(adapter.kind).toBe("demo");
    const account = await adapter.connect();
    expect(account.address).toBe(DEMO_IDENTITY_ADDRESS);
    expect(account.demo).toBe(true);
    expect(account.label).toBe("DEMO");
    expect(JSON.stringify(account)).not.toMatch(/privateKey|mnemonic/i);
  });

  it("never selects a browser adapter on iOS", () => {
    setRuntimeForTests("ios");
    ;(globalThis as { ethereum?: unknown }).ethereum = { request: async () => [], isMetaMask: true };
    expect(getWalletAdapter().kind).not.toBe("browser");
  });

  it("uses the demo adapter on web when no provider is injected", () => {
    setRuntimeForTests("web");
    expect(getDemoWalletAdapter().kind).toBe("demo");
    expect(getWalletAdapter().kind).toBe("demo");
  });
});

describe("wallet error normalization", () => {
  it("hides extension internals from the user", () => {
    const normalized = normalizeWalletError(new Error("Failed to connect to MetaMask"));
    expect(normalized.code).toBe("PROVIDER_ERROR");
    expect(normalized.message).not.toContain("chrome-extension://");
    expect(normalized.message).not.toContain("inpage.js");
    expect(normalized.recoverable).toBe(true);
  });

  it("maps missing wallets to a recoverable demo path", () => {
    const normalized = normalizeWalletError(new Error("MetaMask is not available on this device."));
    expect(normalized.code).toBe("NO_PROVIDER");
    expect(normalized.recoverable).toBe(true);
  });

  it("maps user rejection without crashing", () => {
    const normalized = normalizeWalletError({ code: 4001 });
    expect(normalized.code).toBe("USER_REJECTED");
    expect(normalized.recoverable).toBe(true);
  });
});
