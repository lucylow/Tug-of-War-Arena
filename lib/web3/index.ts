export { MetaMaskProvider, useWallet } from "./MetaMaskProvider";
export { GAME_ABI, FRIENDZONE_NFT_ABI, FRIENDZONE_TOKEN_ABI, TUG_OF_WAR_ARENA_ABI, SOCIAL_REPUTATION_ABI, CONTENT_TIPPING_ABI, SOULBOUND_BADGES_ABI, SOCIAL_LEADERBOARD_ABI } from "./abi";
export {
  ARENA_AUTO_START_PLAYERS,
  ARENA_MATCH_DURATION_SECONDS,
  ARENA_MAX_PLAYERS,
  ARENA_WIN_THRESHOLD,
  FZONE_ENTRY_FEE,
  FZONE_ENTRY_FEE_LABEL,
  FRIENDZONE_ADDRESSES,
  POLYGON_AMOY_CHAIN_ID,
  POLYGON_MAINNET_CHAIN_ID,
  UNCONFIGURED_ADDRESSES,
  ZERO_ADDRESS,
  getFriendzoneAddresses,
  isContractsConfigured,
  isHexAddress,
  isLiveContractAddress,
  isZeroAddress,
} from "./addresses";
export type { FriendzoneAddresses, FriendzoneContractName } from "./addresses";
export {
  DEFAULT_CHAIN_ID,
  NETWORKS,
  SUPPORTED_NETWORKS,
  getExplorerAddressUrl,
  getExplorerTxUrl,
  getGameContractAddress,
  getNftContractAddress,
  getSocialReputationAddress,
  getTokenContractAddress,
} from "./config";
export { formatAddress, formatBalance, formatWalletModeBadge, getNativeSymbol, getNetworkName } from "./format";
export { decodeMatchCreated, decodeMatchView, decodePlayerInMatch, decodePlayerStats } from "./match";
export { DEMO_ACCOUNT } from "./session";
export { WalletService } from "./WalletService";
export type { WalletInfo } from "./WalletService";
export {
  classifyContractError,
  classifyWalletError,
  formatContractError,
  formatWalletError,
  formatWalletErrorTitle,
  isConnectivityFailure,
  isContractRevert,
  isPendingRequest,
  isSubmittedTransactionFailure,
  isUserRejected,
  shouldFallbackToDemo,
  toUserFacingError,
  toWalletError,
} from "./errors";
export { needsTokenApproval, parseEtherAmount } from "./token";
export { requireLiveContracts, resolveLiveContracts } from "./live";
