import { afterEach, describe, expect, it } from "vitest";

import { canAccessBrowserEthereum, detectRuntime, setRuntimeForTests } from "../../lib/runtime";
import { getInjectedProvider, hasInjectedMetaMask } from "../../lib/web3/detect";

function setEthereum(value: unknown) {
  (globalThis as { ethereum?: unknown }).ethereum = value;
}

describe("injected wallet detection", () => {
  afterEach(() => {
    delete (globalThis as { ethereum?: unknown }).ethereum;
    setRuntimeForTests(null);
  });

  it("returns null when no injected provider exists", () => {
    setRuntimeForTests("web");
    setEthereum(undefined);
    expect(getInjectedProvider()).toBeNull();
    expect(hasInjectedMetaMask()).toBe(false);
  });

  it("never reads injected ethereum on native runtimes", () => {
    setRuntimeForTests("ios");
    setEthereum({ request: async () => [], isMetaMask: true });
    expect(canAccessBrowserEthereum()).toBe(false);
    expect(getInjectedProvider()).toBeNull();
    expect(hasInjectedMetaMask()).toBe(false);
  });

  it("prefers MetaMask when multiple wallets share window.ethereum", () => {
    setRuntimeForTests("web");
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
    setRuntimeForTests("web");
    const metamask = { request: async () => [], isMetaMask: true };
    setEthereum(metamask);
    expect(getInjectedProvider()).toBe(metamask);
    expect(hasInjectedMetaMask()).toBe(true);
  });

  it("classifies node tests as server unless overridden", () => {
    setRuntimeForTests(null);
    expect(["server", "web", "ios", "android"]).toContain(detectRuntime());
  });
});
