/**
 * Human-readable ABIs for the Friendzone mobile client.
 * The playable loop stays offline; these fragments are the approved mint/settle
 * boundary once a chain id in `addresses.ts` is populated.
 */
export const TUG_OF_WAR_ARENA_ABI = [
  "function createMatch(string displayName) returns (uint256)",
  "function joinMatch(uint256 matchId, string displayName)",
  "function leaveMatch(uint256 matchId)",
  "function startMatch(uint256 matchId)",
  "function updatePower(uint256 matchId, address player, uint256 delta)",
  "function settleMatch(uint256 matchId, uint256 sunPower, uint256 moonPower)",
  "function getMatch(uint256 matchId) view returns (uint256 id, address[] players, uint256 startTime, uint256 endTime, uint8 status, uint8 winner, uint256 prizePool, uint256 sunPower, uint256 moonPower)",
  "function getPlayerInMatch(uint256 matchId, address player) view returns (tuple(address wallet, string displayName, uint8 team, uint256 power, bool isReady))",
  "function playerElo(address player) view returns (uint256)",
  "function nextMatchId() view returns (uint256)",
  "function entryFee() view returns (uint256)",
  "function winThreshold() view returns (uint256)",
  "function matchDuration() view returns (uint256)",
  "event MatchCreated(uint256 indexed matchId, address indexed host, string displayName)",
  "event MatchFinished(uint256 indexed matchId, uint8 winner, uint256 prizePool, uint256 sunPower, uint256 moonPower)",
  "event NFTAwarded(address indexed to, uint256 indexed tokenId, uint8 rarity, uint256 indexed matchId)",
] as const;

export const GAME_ABI = [
  "function createMatch(string displayName) returns (uint256)",
  "function joinMatch(uint256 matchId, string displayName)",
  "function leaveMatch(uint256 matchId)",
  "function startMatch(uint256 matchId)",
  "function getMatch(uint256 matchId) view returns (uint256, address[], uint256, uint256, uint8, uint8, uint256, uint256, uint256)",
  "function nextMatchId() view returns (uint256)",
  "function entryFee() view returns (uint256)",
  "event MatchCreated(uint256 indexed matchId, address indexed host, string displayName)",
  "event MatchStarted(uint256 indexed matchId, uint256 startTime)",
  "event MatchFinished(uint256 indexed matchId, uint8 winner, uint256 prizePool, uint256 sunPower, uint256 moonPower)",
] as const;

export const FRIENDZONE_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address account) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
] as const;

export const FRIENDZONE_NFT_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function getPowerBonus(uint256 tokenId) view returns (uint256)",
  "function getSpeedBonus(uint256 tokenId) view returns (uint256)",
  "function nftData(uint256 tokenId) view returns (uint8 rarity, uint256 powerBonus, uint256 speedBonus, uint256 mintedAt, bool isEvolved)",
  "function tokenURI(uint256 tokenId) view returns (string)",
] as const;

export const SOCIAL_REPUTATION_ABI = [
  "function follow(address target)",
  "function unfollow(address target)",
  "function setMetadata(string metadata)",
  "function getReputation(address user) view returns (tuple(uint256 score, uint256 trustLevel, uint256 interactions, uint256 positiveFeedback, uint256 negativeFeedback, uint256 lastActive, uint256 followers, uint256 following, bool isVerified, string metadata))",
  "function isFollowing(address follower, address target) view returns (bool)",
  "function getFollowers(address user) view returns (address[])",
  "function getFollowing(address user) view returns (address[])",
  "event Followed(address indexed follower, address indexed target)",
  "event ReputationUpdated(address indexed user, uint256 newScore, uint256 trustLevel)",
] as const;

export const CONTENT_TIPPING_ABI = [
  "function registerContent(string contentId)",
  "function sendTip(string contentId, uint256 amount, string message)",
  "function claimTips(uint256[] tipIds)",
  "function getContent(string contentId) view returns (tuple(string id, address creator, uint256 totalTips, uint256 tipCount, uint256 lastTipTime, bool active))",
  "event TipSent(uint256 indexed tipId, address indexed from, address indexed to, uint256 amount)",
] as const;

export const SOULBOUND_BADGES_ABI = [
  "function getPlayerBadges(address player) view returns (uint256[])",
  "function hasBadge(uint256 badgeId, address player) view returns (bool)",
  "function getBadge(uint256 badgeId) view returns (tuple(uint256 id, string name, string description, uint8 tier, string category, uint256 maxSupply, uint256 minted, bool active))",
] as const;

export const SOCIAL_LEADERBOARD_ABI = [
  "function addPlayer(address player)",
  "function getPlayerTotalScore(address player) view returns (uint256)",
  "function getTopPlayers(uint256 count) view returns (tuple(address player, uint256 reputationScore, uint256 engagementScore, uint256 influenceScore, uint256 totalScore, uint256 rank)[])",
] as const;
