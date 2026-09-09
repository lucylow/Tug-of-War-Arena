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

import { DemoModeManager } from "../../lib/mock/DemoModeManager";
import { WalletService } from "../../lib/web3/WalletService";
import { DEMO_ACCOUNT } from "../../lib/web3/session";
import { connectLiveSession } from "../../lib/web3/client";

describe("WalletService", () => {
  beforeEach(() => {
    WalletService.resetForTests();
    DemoModeManager.resetForTests();
    vi.mocked(connectLiveSession).mockReset();
  });

  afterEach(() => {
    WalletService.resetForTests();
    DemoModeManager.resetForTests();
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

  it("switches a demo session locally without talking to MetaMask", async () => {
    const wallet = WalletService.getInstance();
    await wallet.connectDemo(80002);
    await wallet.switchNetwork(137);
    expect(wallet.getChainId()).toBe(137);
  });

  it("surfaces live connection failures when the user rejects", async () => {
    vi.mocked(connectLiveSession).mockRejectedValueOnce({ code: 4001, message: "User rejected" });
    const wallet = WalletService.getInstance();
    await expect(wallet.connect()).rejects.toThrow("Connection was rejected in MetaMask.");
  });

  it("falls back to a seeded demo wallet when live connect is unavailable", async () => {
    vi.mocked(connectLiveSession).mockRejectedValueOnce(new Error("MetaMask is not available on this device."));
    const wallet = WalletService.getInstance();
    const info = await wallet.connect();
    expect(info.address).toBe(DEMO_ACCOUNT);
    expect(info.isConnected).toBe(true);
    expect(DemoModeManager.getInstance().isActive()).toBe(true);
    expect(Number.parseFloat(info.balance)).toBeGreaterThan(0);
  });
});
