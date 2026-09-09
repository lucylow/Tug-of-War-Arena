export { DemoModeManager, type MockFallbackReason } from "@/lib/mock/DemoModeManager";
export {
  MOCK_FALLBACK_COPY,
  ensureMockBlockchain,
  findMockMatch,
  mockMatchReceipt,
  noteMockFallback,
  requireMockMatch,
  runLiveOrMock,
  shouldUseMockFallback,
  toArenaMatchView,
  toArenaPlayerStats,
  toArenaPlayerView,
  withMockFallback,
} from "@/lib/mock/fallback";
export type { MockTxReceipt } from "@/lib/mock/fallback";
export { MOCK_CONFIG, sampleDelayMs, sleep } from "@/lib/mock/config";
export {
  DEFAULT_MOCK_SEED,
  MOCK_ACHIEVEMENT_COUNT,
  MOCK_MATCH_COUNT,
  MOCK_NFT_COUNT,
  MOCK_PREDICTION_COUNT,
  MOCK_QUEST_COUNT,
  MOCK_RENTAL_COUNT,
  MOCK_USER_COUNT,
  SeededRandom,
} from "@/lib/mock/seed";
export * from "@/lib/mock/generators";
export * from "@/lib/mock/services";
