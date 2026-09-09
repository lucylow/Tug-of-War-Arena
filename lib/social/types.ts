export type PresenceStatus = "online" | "offline" | "in-game" | "away";

export interface SocialFriend {
  id: string;
  displayName: string;
  avatarUrl: string;
  status: PresenceStatus;
  lastSeen: string;
  level: number;
  wins: number;
  isFriend: boolean;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromDisplayName: string;
  fromAvatarUrl: string;
  sentAt: string;
  status: "pending" | "accepted" | "rejected";
  toUserId?: string;
}

export interface FriendState {
  friends: SocialFriend[];
  pendingRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  onlineUsers: string[];
  searchResults: SocialFriend[];
  loading: boolean;
  error: string | null;
}

export type ChatChannel = "direct" | "party" | "global";

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  channel: ChatChannel;
  recipientId?: string;
  read: boolean;
}

export interface ChatState {
  messages: ChatMessage[];
  unreadCount: number;
  activeChannel: string | null;
  loading: boolean;
  error: string | null;
}

export type GuildRole = "leader" | "officer" | "member";

export interface GuildMember {
  userId: string;
  displayName: string;
  avatarUrl: string;
  role: GuildRole;
  joinedAt: string;
}

export interface SocialGuild {
  id: string;
  name: string;
  tag: string;
  description: string;
  leaderId: string;
  members: GuildMember[];
  reputation: number;
  memberCount: number;
  createdAt: string;
}

export interface GuildState {
  myGuild: SocialGuild | null;
  guilds: SocialGuild[];
  loading: boolean;
  error: string | null;
}

export type FeedAction = "match_won" | "match_lost" | "achievement" | "friend_added" | "guild_joined";

export interface FeedItem {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string;
  action: FeedAction;
  details: Record<string, string>;
  timestamp: string;
  likes: number;
  liked: boolean;
}

export interface FeedPage {
  items: FeedItem[];
  page: number;
  hasMore: boolean;
}

export interface FeedState {
  items: FeedItem[];
  loading: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
}

export type LeaderboardFilter = "global" | "friends" | "guild";

export interface SocialLeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl: string;
  wins: number;
  taps: number;
  reputation: number;
  rank: number;
}

export interface LeaderboardState {
  entries: SocialLeaderboardEntry[];
  filter: LeaderboardFilter;
  loading: boolean;
  error: string | null;
}

export interface SocialSnapshot {
  currentUserId: string;
  currentUserName: string;
  friend: FriendState;
  chat: ChatState;
  guild: GuildState;
  feed: FeedState;
  leaderboard: LeaderboardState;
}

export const CURRENT_USER_ID = "you";
export const CURRENT_USER_NAME = "You";
