import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    setItem: vi.fn(async () => undefined),
    getItem: vi.fn(async () => null),
    removeItem: vi.fn(async () => undefined),
  },
}));

vi.mock("../../lib/web3/client", () => ({
  connectLiveSession: vi.fn(),
  disconnectLiveSession: vi.fn(async () => undefined),
}));

import { WalletService } from "../../lib/web3/WalletService";
import { DEMO_ACCOUNT } from "../../lib/web3/session";
import { connectLiveSession } from "../../lib/web3/client";

describe("WalletService", () => {
  beforeEach(() => {
    WalletService.resetForTests();
    vi.mocked(connectLiveSession).mockReset();
  });

  afterEach(() => {
    WalletService.resetForTests();
  });

  it("returns the same singleton instance", () => {
    expect(WalletService.getInstance()).toBe(WalletService.getInstance());
  });

  it("starts disconnected", () => {
    const wallet = WalletService.getInstance();
    expect(wallet.isConnected()).toBe(false);
    expect(wallet.getAddress()).toBeNull();
  });

  it("connects a local demo session without MetaMask", async () => {
    const wallet = WalletService.getInstance();
    const info = await wallet.connectDemo(137);
    expect(info.address).toBe(DEMO_ACCOUNT);
    expect(info.chainId).toBe(137);
    expect(info.isConnected).toBe(true);
    expect(wallet.getAddress()).toBe(DEMO_ACCOUNT);
  });

  it("clears demo state on disconnect", async () => {
    const wallet = WalletService.getInstance();
    await wallet.connectDemo(80002);
    await wallet.disconnect();
    expect(wallet.isConnected()).toBe(false);
    expect(wallet.getAddress()).toBeNull();
  });

  it("surfaces live connection failures", async () => {
    vi.mocked(connectLiveSession).mockRejectedValueOnce(new Error("User rejected"));
    const wallet = WalletService.getInstance();
    await expect(wallet.connect()).rejects.toThrow("User rejected");
  });
});
