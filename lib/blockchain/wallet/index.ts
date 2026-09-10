export type {
  Eip1193Provider,
  Eip1193RequestArgs,
  WalletAdapter,
  WalletConnectOptions,
  WalletProviderId,
  WalletSession,
  WalletStatus,
} from "./types";
export {
  DEMO_SIGNATURE,
  DEMO_WALLET_ADDRESS,
  WALLET_CONNECT_TIMEOUT_MS,
  WALLET_SESSION_STORAGE_KEY,
} from "./types";
export {
  classifyWalletErrorCode,
  createWalletError,
  getProviderErrorCode,
  isUserRejectedError,
  normalizeWalletError,
  readProviderErrorMessage,
  sanitizeWalletMessage,
  shouldAutoFallbackToDemo,
  shouldOfferDemoFallback,
  toWalletUserMessage,
  WALLET_UNAVAILABLE_MESSAGE,
  safeWalletDiagnostic,
  type NormalizedWalletError,
  type NormalizedWalletErrorCode,
  type WalletErrorCode,
} from "./errors";
export { walletCapabilities, type WalletCapabilities } from "./capabilities";
export { BrowserWalletAdapter } from "./browserAdapter";
export { MobileWalletAdapter } from "./mobileAdapter";
export { DemoWalletAdapter } from "./demoAdapter";
export { WalletManager, getWalletManager } from "./manager";
export { getBrowserEthereumProvider, hasInjectedMetaMask } from "./provider";
export { withTimeout } from "./timeout";
export { persistWalletSession, readPersistedWalletSession, clearPersistedWalletSession } from "./storage";
