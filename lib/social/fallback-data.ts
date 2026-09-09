import type {
  ChatMessage,
  FeedItem,
  FriendRequest,
  SocialFriend,
  SocialGuild,
  SocialLeaderboardEntry,
} from "./types";
import { CURRENT_USER_ID, CURRENT_USER_NAME } from "./types";

function avatar(id: string): string {
  return `https://i.pravatar.cc/150?u=${id}`;
}

export const SOCIAL_DIRECTORY: SocialFriend[] = [
  { id: CURRENT_USER_ID, displayName: CURRENT_USER_NAME, avatarUrl: avatar(CURRENT_USER_ID), status: "online", lastSeen: "2026-09-09T00:00:00.000Z", level: 4, wins: 8, isFriend: false },
  { id: "novanina", displayName: "NovaNina", avatarUrl: avatar("novanina"), status: "online", lastSeen: "2026-09-09T00:40:00.000Z", level: 6, wins: 12, isFriend: true },
  { id: "pixelpuller", displayName: "PixelPuller", avatarUrl: avatar("pixelpuller"), status: "in-game", lastSeen: "2026-09-09T00:41:00.000Z", level: 5, wins: 15, isFriend: true },
  { id: "moonrunner", displayName: "MoonRunner", avatarUrl: avatar("moonrunner"), status: "online", lastSeen: "2026-09-09T00:30:00.000Z", level: 4, wins: 7, isFriend: true },
  { id: "sunspark", displayName: "SunSpark", avatarUrl: avatar("sunspark"), status: "away", lastSeen: "2026-09-08T23:50:00.000Z", level: 3, wins: 6, isFriend: true },
  { id: "roperanger", displayName: "RopeRanger", avatarUrl: avatar("roperanger"), status: "offline", lastSeen: "2026-09-08T22:10:00.000Z", level: 8, wins: 18, isFriend: true },
  { id: "torquekid", displayName: "TorqueKid", avatarUrl: avatar("torquekid"), status: "offline", lastSeen: "2026-09-08T21:12:00.000Z", level: 3, wins: 5, isFriend: true },
  { id: "manamax", displayName: "ManaMax", avatarUrl: avatar("manamax"), status: "online", lastSeen: "2026-09-09T00:20:00.000Z", level: 5, wins: 9, isFriend: false },
  { id: "decentradeb", displayName: "DecentraDeb", avatarUrl: avatar("decentradeb"), status: "in-game", lastSeen: "2026-09-09T00:38:00.000Z", level: 4, wins: 4, isFriend: false },
  { id: "orbitace", displayName: "OrbitAce", avatarUrl: avatar("orbitace"), status: "away", lastSeen: "2026-09-08T23:10:00.000Z", level: 2, wins: 3, isFriend: false },
  { id: "neontug", displayName: "NeonTug", avatarUrl: avatar("neontug"), status: "online", lastSeen: "2026-09-09T00:15:00.000Z", level: 2, wins: 2, isFriend: false },
];

export const SOCIAL_PENDING_REQUESTS: FriendRequest[] = [
  {
    id: "req_orbitace",
    fromUserId: "orbitace",
    fromDisplayName: "OrbitAce",
    fromAvatarUrl: avatar("orbitace"),
    sentAt: "2026-09-08T18:00:00.000Z",
    status: "pending",
    toUserId: CURRENT_USER_ID,
  },
];

export const SOCIAL_MESSAGES: ChatMessage[] = [
  {
    id: "msg_1",
    senderId: "novanina",
    senderName: "NovaNina",
    senderAvatar: avatar("novanina"),
    content: "Sun Crew lounge is open — who is pulling first?",
    timestamp: "2026-09-09T00:10:00.000Z",
    channel: "global",
    read: true,
  },
  {
    id: "msg_2",
    senderId: "pixelpuller",
    senderName: "PixelPuller",
    senderAvatar: avatar("pixelpuller"),
    content: "Moon side is stacked. Run it back after Plaza Sprint.",
    timestamp: "2026-09-09T00:12:00.000Z",
    channel: "global",
    read: true,
  },
  {
    id: "msg_3",
    senderId: "moonrunner",
    senderName: "MoonRunner",
    senderAvatar: avatar("moonrunner"),
    content: "Party chat ready. Bring the surge.",
    timestamp: "2026-09-09T00:14:00.000Z",
    channel: "party",
    read: false,
  },
  {
    id: "msg_4",
    senderId: "sunspark",
    senderName: "SunSpark",
    senderAvatar: avatar("sunspark"),
    content: "Guild board is live. Claim the Plaza Relay if you are free.",
    timestamp: "2026-09-09T00:16:00.000Z",
    channel: "global",
    read: true,
  },
];

export const SOCIAL_GUILDS: SocialGuild[] = [
  {
    id: "guild_sun",
    name: "Sun Crew",
    tag: "SUN",
    description: "Gold-side pullers for Friendzone Plaza Sprint.",
    leaderId: "novanina",
    reputation: 420,
    memberCount: 3,
    createdAt: "2026-08-01T00:00:00.000Z",
    members: [
      { userId: "novanina", displayName: "NovaNina", avatarUrl: avatar("novanina"), role: "leader", joinedAt: "2026-08-01T00:00:00.000Z" },
      { userId: "sunspark", displayName: "SunSpark", avatarUrl: avatar("sunspark"), role: "officer", joinedAt: "2026-08-12T00:00:00.000Z" },
      { userId: "roperanger", displayName: "RopeRanger", avatarUrl: avatar("roperanger"), role: "member", joinedAt: "2026-08-20T00:00:00.000Z" },
    ],
  },
  {
    id: "guild_moon",
    name: "Moon Crew",
    tag: "MOON",
    description: "Cyan-side scouts holding the east pad.",
    leaderId: "pixelpuller",
    reputation: 388,
    memberCount: 3,
    createdAt: "2026-08-02T00:00:00.000Z",
    members: [
      { userId: "pixelpuller", displayName: "PixelPuller", avatarUrl: avatar("pixelpuller"), role: "leader", joinedAt: "2026-08-02T00:00:00.000Z" },
      { userId: "moonrunner", displayName: "MoonRunner", avatarUrl: avatar("moonrunner"), role: "officer", joinedAt: "2026-08-14T00:00:00.000Z" },
      { userId: "torquekid", displayName: "TorqueKid", avatarUrl: avatar("torquekid"), role: "member", joinedAt: "2026-08-22T00:00:00.000Z" },
    ],
  },
  {
    id: "guild_plaza",
    name: "Plaza Relay",
    tag: "PLZ",
    description: "Parcel 0,0 handoff crew for wearables and RSVPs.",
    leaderId: "manamax",
    reputation: 210,
    memberCount: 2,
    createdAt: "2026-08-18T00:00:00.000Z",
    members: [
      { userId: "manamax", displayName: "ManaMax", avatarUrl: avatar("manamax"), role: "leader", joinedAt: "2026-08-18T00:00:00.000Z" },
      { userId: "decentradeb", displayName: "DecentraDeb", avatarUrl: avatar("decentradeb"), role: "member", joinedAt: "2026-08-19T00:00:00.000Z" },
    ],
  },
];

export const SOCIAL_FEED: FeedItem[] = [
  {
    id: "feed_1",
    userId: "novanina",
    displayName: "NovaNina",
    avatarUrl: avatar("novanina"),
    action: "match_won",
    details: { team: "Sun Crew" },
    timestamp: "2026-09-09T00:05:00.000Z",
    likes: 4,
    liked: false,
  },
  {
    id: "feed_2",
    userId: "pixelpuller",
    displayName: "PixelPuller",
    avatarUrl: avatar("pixelpuller"),
    action: "achievement",
    details: { badgeName: "Seven-Tap Surge" },
    timestamp: "2026-09-08T22:40:00.000Z",
    likes: 6,
    liked: false,
  },
  {
    id: "feed_3",
    userId: "sunspark",
    displayName: "SunSpark",
    avatarUrl: avatar("sunspark"),
    action: "guild_joined",
    details: { guildName: "Sun Crew" },
    timestamp: "2026-09-08T20:12:00.000Z",
    likes: 2,
    liked: false,
  },
  {
    id: "feed_4",
    userId: CURRENT_USER_ID,
    displayName: CURRENT_USER_NAME,
    avatarUrl: avatar(CURRENT_USER_ID),
    action: "friend_added",
    details: { friendName: "MoonRunner" },
    timestamp: "2026-09-08T19:00:00.000Z",
    likes: 1,
    liked: true,
  },
  {
    id: "feed_5",
    userId: "roperanger",
    displayName: "RopeRanger",
    avatarUrl: avatar("roperanger"),
    action: "match_lost",
    details: { team: "Moon Crew" },
    timestamp: "2026-09-08T18:22:00.000Z",
    likes: 3,
    liked: false,
  },
];

export const SOCIAL_LEADERBOARD: SocialLeaderboardEntry[] = [
  { userId: "roperanger", displayName: "RopeRanger", avatarUrl: avatar("roperanger"), wins: 18, taps: 842, reputation: 90, rank: 1 },
  { userId: "pixelpuller", displayName: "PixelPuller", avatarUrl: avatar("pixelpuller"), wins: 15, taps: 716, reputation: 82, rank: 2 },
  { userId: "novanina", displayName: "NovaNina", avatarUrl: avatar("novanina"), wins: 12, taps: 644, reputation: 76, rank: 3 },
  { userId: CURRENT_USER_ID, displayName: CURRENT_USER_NAME, avatarUrl: avatar(CURRENT_USER_ID), wins: 8, taps: 503, reputation: 54, rank: 4 },
  { userId: "moonrunner", displayName: "MoonRunner", avatarUrl: avatar("moonrunner"), wins: 7, taps: 481, reputation: 48, rank: 5 },
  { userId: "sunspark", displayName: "SunSpark", avatarUrl: avatar("sunspark"), wins: 6, taps: 438, reputation: 44, rank: 6 },
  { userId: "torquekid", displayName: "TorqueKid", avatarUrl: avatar("torquekid"), wins: 5, taps: 392, reputation: 38, rank: 7 },
  { userId: "manamax", displayName: "ManaMax", avatarUrl: avatar("manamax"), wins: 4, taps: 327, reputation: 33, rank: 8 },
];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function socialFallbackFriends(): SocialFriend[] {
  return clone(SOCIAL_DIRECTORY.filter((user) => user.isFriend).map((user) => ({ ...user, isFriend: true })));
}

export function socialFallbackSnapshot() {
  return {
    friends: socialFallbackFriends(),
    pendingRequests: clone(SOCIAL_PENDING_REQUESTS.filter((request) => request.status === "pending")),
    messages: clone(SOCIAL_MESSAGES),
    guilds: clone(SOCIAL_GUILDS),
    feed: clone(SOCIAL_FEED),
    leaderboard: clone(SOCIAL_LEADERBOARD),
  };
}
