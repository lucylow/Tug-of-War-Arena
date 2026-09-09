import { MOCK_CONFIG, sampleDelayMs, sleep } from "@/lib/mock/config";
import type { MockEventHandler } from "@/lib/mock/emitter";
import type { MockMatch } from "@/lib/mock/generators";
import { DEFAULT_MOCK_SEED } from "@/lib/mock/seed";
import type { IMockBlockchain } from "@/lib/mock/services/IMockBlockchain";
import { MockBlockchain, type MockBlockchainOptions } from "@/lib/mock/services/MockBlockchain";

const PASSTHROUGH = new Set(["on", "off", "inner"]);

export interface MockBlockchainAsync extends IMockBlockchain {}

/**
 * Async facade that wraps mock-chain calls with simulated network latency
 * and delayed match resolution so the demo feels like a live RPC.
 */
export class MockBlockchainAsync {
  readonly inner: MockBlockchain;

  constructor(seedOrService: number | MockBlockchain = DEFAULT_MOCK_SEED, options: MockBlockchainOptions = {}) {
    this.inner =
      seedOrService instanceof MockBlockchain
        ? seedOrService
        : new MockBlockchain(seedOrService, { ...options, latencyMs: 0 });

    return new Proxy(this, {
      get: (target, prop, receiver) => {
        if (prop === "createMatch") {
          return (playerIds: string[]) => target.createMatch(playerIds);
        }
        if (typeof prop === "string" && PASSTHROUGH.has(prop)) {
          const value = Reflect.get(target, prop, receiver);
          return typeof value === "function" ? value.bind(target) : value;
        }
        const innerValue = Reflect.get(target.inner, prop);
        if (typeof innerValue !== "function") {
          return innerValue;
        }
        return async (...args: unknown[]) => {
          await wait();
          return innerValue.apply(target.inner, args);
        };
      },
    }) as MockBlockchainAsync;
  }

  async createMatch(playerIds: string[]): Promise<MockMatch> {
    await wait(MOCK_CONFIG.matchCreationDelayMs);
    const match = await this.inner.createMatch(playerIds);
    setTimeout(() => {
      this.inner.world.events.emit("MatchResolved", match);
    }, MOCK_CONFIG.matchResolveDelayMs);
    return match;
  }

  on(eventName: string, callback: MockEventHandler): void {
    this.inner.on(eventName, callback);
  }

  off(eventName: string, callback: MockEventHandler): void {
    this.inner.off(eventName, callback);
  }
}

async function wait(ms?: number): Promise<void> {
  await sleep(ms ?? sampleDelayMs(MOCK_CONFIG.minDelayMs, MOCK_CONFIG.maxDelayMs));
}
