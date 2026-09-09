import { MOCK_CONFIG } from "@/lib/mock/config";
import { DEFAULT_MOCK_SEED } from "@/lib/mock/seed";
import { MockBlockchain } from "@/lib/mock/services/MockBlockchain";
import { MockBlockchainAsync } from "@/lib/mock/services/MockBlockchainAsync";

export type MockFallbackReason =
  | "demo-session"
  | "unconfigured-contract"
  | "live-unavailable"
  | "request-failed"
  | "explicit";

export class DemoModeManager {
  private static instance: DemoModeManager | null = null;
  private isEnabled = false;
  private mockService: MockBlockchain | null = null;
  private asyncService: MockBlockchainAsync | null = null;
  private seed: number = DEFAULT_MOCK_SEED;
  private fallbackReason: MockFallbackReason | null = null;
  private listeners = new Set<() => void>();

  private constructor() {}

  static getInstance(): DemoModeManager {
    if (!DemoModeManager.instance) {
      DemoModeManager.instance = new DemoModeManager();
    }
    return DemoModeManager.instance;
  }

  /** Test-only: drop singleton state so suites do not leak across files. */
  static resetForTests(): void {
    DemoModeManager.instance = null;
  }

  private worldOptions() {
    return {
      userCount: MOCK_CONFIG.userCount,
      nftCount: MOCK_CONFIG.nftCount,
      matchCount: MOCK_CONFIG.matchCount,
      questCount: MOCK_CONFIG.questCount,
      predictionCount: MOCK_CONFIG.predictionCount,
      achievementCount: MOCK_CONFIG.achievementCount,
      rentalCount: MOCK_CONFIG.rentalCount,
      latencyMs: 0 as const,
    };
  }

  enable(seed?: number, reason: MockFallbackReason = "explicit"): MockBlockchain {
    if (this.isEnabled && this.mockService && (seed == null || seed === this.seed)) {
      this.fallbackReason = this.fallbackReason ?? reason;
      return this.mockService;
    }
    this.seed = seed ?? DEFAULT_MOCK_SEED;
    this.mockService = new MockBlockchain(this.seed, this.worldOptions());
    this.asyncService = new MockBlockchainAsync(this.mockService);
    this.isEnabled = true;
    this.fallbackReason = reason;
    this.notify();
    if (typeof console !== "undefined") {
      console.log("Demo Mode ENABLED (seed:", this.seed, ")");
    }
    return this.mockService;
  }

  ensureEnabled(seed: number = this.seed): MockBlockchain {
    if (this.mockService && this.isEnabled && seed === this.seed) return this.mockService;
    return this.enable(seed, this.fallbackReason ?? "demo-session");
  }

  disable(): void {
    if (!this.isEnabled && !this.mockService) return;
    this.isEnabled = false;
    this.mockService = null;
    this.asyncService = null;
    this.fallbackReason = null;
    this.notify();
    if (typeof console !== "undefined") {
      console.log("Demo Mode DISABLED");
    }
  }

  toggle(): void {
    if (this.isEnabled) this.disable();
    else this.enable();
  }

  isActive(): boolean {
    return this.isEnabled;
  }

  getMockService(): MockBlockchain | null {
    return this.mockService;
  }

  getAsyncService(): MockBlockchainAsync | null {
    return this.asyncService;
  }

  getOrCreateService(seed: number = this.seed): MockBlockchain {
    return this.ensureEnabled(seed);
  }

  setFallbackReason(reason: MockFallbackReason): void {
    this.fallbackReason = reason;
  }

  getFallbackReason(): MockFallbackReason | null {
    return this.fallbackReason;
  }

  getBlockchain(): MockBlockchain | null {
    return this.mockService;
  }

  getSeed(): number {
    return this.seed;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }
}
