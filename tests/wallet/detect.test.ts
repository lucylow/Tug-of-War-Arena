import { afterEach, describe, expect, it } from "vitest";

import { getInjectedProvider, hasInjectedMetaMask } from "../../lib/web3/detect";

function setEthereum(value: unknown) {
  (globalThis as { ethereum?: unknown }).ethereum = value;
}

describe("injected wallet detection", () => {
  afterEach(() => {
    delete (globalThis as { ethereum?: unknown }).ethereum;
  });

  it("returns null when no injected provider exists", () => {
    setEthereum(undefined);
    expect(getInjectedProvider()).toBeNull();
    expect(hasInjectedMetaMask()).toBe(false);
  });

  it("prefers MetaMask when multiple wallets share window.ethereum", () => {
    const coinbase = { request: async () => [], isMetaMask: false };
    const metamask = { request: async () => [], isMetaMask: true };
    setEthereum({
      request: coinbase.request,
      isMetaMask: false,
      providers: [coinbase, metamask],
    });
    expect(getInjectedProvider()).toBe(metamask);
    expect(hasInjectedMetaMask()).toBe(true);
  });

  it("uses the injected provider when it is MetaMask", () => {
    const metamask = { request: async () => [], isMetaMask: true };
    setEthereum(metamask);
    expect(getInjectedProvider()).toBe(metamask);
    expect(hasInjectedMetaMask()).toBe(true);
  });
});
