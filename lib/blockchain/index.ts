export type { NormalizedWalletError, NormalizedWalletErrorCode } from "./wallet/errors";
export {
  WALLET_UNAVAILABLE_MESSAGE,
  normalizeWalletError,
  safeWalletDiagnostic,
  toWalletUserMessage,
} from "./wallet/errors";
export type {
  WalletAccount,
  CompanionWalletAdapter as WalletAdapter,
  WalletAdapterKind,
  WalletConnectionState,
  WalletUiSnapshot,
} from "./wallet/types";
export { getDemoWalletAdapter, getWalletAdapter, getWalletAdapterByKind } from "./wallet/factory";
export { DEMO_IDENTITY_ADDRESS, DEMO_WALLET_ACCOUNT, DemoWalletAdapter } from "./wallet/adapters/demo";
export { BrowserWalletAdapter } from "./wallet/adapters/browser";
export { ReactNativeWalletAdapter } from "./wallet/adapters/react-native";
export {
  CHAIN_ID,
  DECENTRALAND_NETWORK,
  EXPLORER_URL,
  assertSupportedChain,
  formatChainId,
  getChainConfig,
  isWrongNetwork,
} from "./network";
export {
  createProofPayload,
  createMatchProof,
  hashMatch,
  hashMatchProof,
  serializeMatch,
  serializeMatchProof,
  verifyProofPayload,
  type MatchProofInput,
  type MatchProofPayload,
  type SerializableMatch,
} from "./matchProof";
export { BlockchainPublisher } from "./publisher";
