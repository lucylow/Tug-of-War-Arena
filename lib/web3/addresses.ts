export const ARENA_WIN_THRESHOLD = 44;
export const ARENA_MATCH_DURATION_SECONDS = 30;
export const ARENA_MAX_PLAYERS = 8;
export const ARENA_AUTO_START_PLAYERS = 4;
export const FZONE_ENTRY_FEE = 10n * 10n ** 18n;
export const FZONE_ENTRY_FEE_LABEL = "10 FZONE";
export const POLYGON_AMOY_CHAIN_ID = 80002;
export const POLYGON_MAINNET_CHAIN_ID = 137;
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

export type FriendzoneContractName =
  | "FriendzoneToken"
  | "FriendzoneNFT"
  | "TugOfWarArena"
  | "FriendzoneBadges"
  | "FriendzoneGuilds"
  | "FriendzoneReferrals"
  | "TournamentBracket"
  | "FriendzoneDAO"
  | "VRFCoordinator"
  | "SocialReputation"
  | "ContentTipping"
  | "PredictionMarket"
  | "SocialStaking"
  | "SoulboundBadges"
  | "DecentralizedChat"
  | "SocialQuests"
  | "SocialLeaderboard"
  | "FriendReferral"
  | "DAOSocialEngagement"
  | "FriendzoneStaking"
  | "FriendzoneLending"
  | "FriendzoneBattle"
  | "FriendzoneBreeding"
  | "FriendzoneDynamic"
  | "FriendzoneMarketplace"
  | "FriendzoneLootBox"
  | "FriendzoneCrafting"
  | "FriendzoneLeaderboard";

export type FriendzoneAddresses = Record<FriendzoneContractName, `0x${string}`>;

const ZERO = ZERO_ADDRESS;

export const UNCONFIGURED_ADDRESSES: FriendzoneAddresses = {
  FriendzoneToken: ZERO,
  FriendzoneNFT: ZERO,
  TugOfWarArena: ZERO,
  FriendzoneBadges: ZERO,
  FriendzoneGuilds: ZERO,
  FriendzoneReferrals: ZERO,
  TournamentBracket: ZERO,
  FriendzoneDAO: ZERO,
  VRFCoordinator: ZERO,
  SocialReputation: ZERO,
  ContentTipping: ZERO,
  PredictionMarket: ZERO,
  SocialStaking: ZERO,
  SoulboundBadges: ZERO,
  DecentralizedChat: ZERO,
  SocialQuests: ZERO,
  SocialLeaderboard: ZERO,
  FriendReferral: ZERO,
  DAOSocialEngagement: ZERO,
  FriendzoneStaking: ZERO,
  FriendzoneLending: ZERO,
  FriendzoneBattle: ZERO,
  FriendzoneBreeding: ZERO,
  FriendzoneDynamic: ZERO,
  FriendzoneMarketplace: ZERO,
  FriendzoneLootBox: ZERO,
  FriendzoneCrafting: ZERO,
  FriendzoneLeaderboard: ZERO,
};

/**
 * Deployed addresses keyed by chain id. Local/demo clients keep the zero
 * addresses so offline play never accidentally submits a live transaction.
 * Replace a chain entry after running `pnpm --dir contracts deploy:amoy`.
 */
export const FRIENDZONE_ADDRESSES: Record<number, FriendzoneAddresses> = {
  31337: { ...UNCONFIGURED_ADDRESSES },
  [POLYGON_AMOY_CHAIN_ID]: { ...UNCONFIGURED_ADDRESSES },
  [POLYGON_MAINNET_CHAIN_ID]: { ...UNCONFIGURED_ADDRESSES },
};

export function getFriendzoneAddresses(chainId: number): FriendzoneAddresses {
  return FRIENDZONE_ADDRESSES[chainId] ?? { ...UNCONFIGURED_ADDRESSES };
}

export function isHexAddress(address: string | null | undefined): boolean {
  return Boolean(address && /^0x[a-fA-F0-9]{40}$/.test(address));
}

export function isZeroAddress(address: string | null | undefined): boolean {
  return Boolean(address && /^0x0{40}$/i.test(address));
}

export function isLiveContractAddress(address: string | null | undefined): boolean {
  return isHexAddress(address) && !isZeroAddress(address);
}

export function isContractsConfigured(addresses: FriendzoneAddresses): boolean {
  return isLiveContractAddress(addresses.TugOfWarArena) && isLiveContractAddress(addresses.FriendzoneToken);
}
