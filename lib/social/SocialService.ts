import { MockEventEmitter } from "@/lib/mock/emitter";

import {
  SOCIAL_DIRECTORY,
  SOCIAL_FEED,
  SOCIAL_GUILDS,
  SOCIAL_LEADERBOARD,
  SOCIAL_MESSAGES,
  SOCIAL_PENDING_REQUESTS,
} from "./fallback-data";
import { filterLeaderboard } from "./reducers";
import type {
  ChatChannel,
  ChatMessage,
  FeedItem,
  FeedPage,
  FriendRequest,
  LeaderboardFilter,
  PresenceStatus,
  SocialFriend,
  SocialGuild,
  SocialLeaderboardEntry,
} from "./types";
import { CURRENT_USER_ID, CURRENT_USER_NAME } from "./types";

type IdFactory = () => string;

function clone<T>(value: T): T {
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    if (Array.isArray(value)) return [...value] as T;
    if (value && typeof value === "object") return { ...(value as Record<string, unknown>) } as T;
    return value;
  }
}

function defaultId(): string {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj && typeof cryptoObj.randomUUID === "function") return cryptoObj.randomUUID();
  return `soc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export class SocialService {
  private users: SocialFriend[];
  private friendsOf = new Set<string>();
  private pending: FriendRequest[];
  private sent: FriendRequest[];
  private messages: ChatMessage[];
  private guilds: SocialGuild[];
  private membership: string | null;
  private feed: FeedItem[];
  private liked = new Set<string>();
  private leaderboard: SocialLeaderboardEntry[];
  private readonly id: IdFactory;
  private readonly now: () => string;
  readonly events = new MockEventEmitter();

  constructor(options?: { id?: IdFactory; now?: () => string }) {
    this.id = options?.id ?? defaultId;
    this.now = options?.now ?? (() => new Date().toISOString());
    this.users = clone(SOCIAL_DIRECTORY);
    this.friendsOf = new Set(SOCIAL_DIRECTORY.filter((user) => user.isFriend).map((user) => user.id));
    this.pending = clone(SOCIAL_PENDING_REQUESTS);
    this.sent = [];
    this.messages = clone(SOCIAL_MESSAGES);
    this.guilds = clone(SOCIAL_GUILDS);
    this.membership = null;
    this.feed = clone(SOCIAL_FEED);
    this.liked = new Set(SOCIAL_FEED.filter((item) => item.liked).map((item) => item.id));
    this.leaderboard = clone(SOCIAL_LEADERBOARD);
  }

  getCurrentUserId(): string {
    return CURRENT_USER_ID;
  }

  getFriends(): SocialFriend[] {
    return this.users.filter((user) => this.friendsOf.has(user.id)).map((user) => ({ ...user, isFriend: true }));
  }

  getFriendRequests(): FriendRequest[] {
    return this.pending.filter((request) => request.status === "pending").map((request) => ({ ...request }));
  }

  getSentRequests(): FriendRequest[] {
    return this.sent.map((request) => ({ ...request }));
  }

  sendFriendRequest(userId: string): FriendRequest {
    if (userId === CURRENT_USER_ID) throw new Error("Cannot friend yourself");
    const target = this.users.find((user) => user.id === userId);
    if (!target) throw new Error("User not found");
    if (this.friendsOf.has(userId)) throw new Error("Already friends");
    if (this.sent.some((request) => request.toUserId === userId && request.status === "pending")) {
      throw new Error("Request already sent");
    }
    const request: FriendRequest = {
      id: this.id(),
      fromUserId: CURRENT_USER_ID,
      fromDisplayName: CURRENT_USER_NAME,
      fromAvatarUrl: "",
      sentAt: this.now(),
      status: "pending",
      toUserId: userId,
    };
    this.sent.push(request);
    this.events.emit("friend_request", request);
    return { ...request };
  }

  acceptFriendRequest(requestId: string): SocialFriend {
    const request = this.pending.find((entry) => entry.id === requestId);
    if (!request) throw new Error("Request not found");
    request.status = "accepted";
    this.pending = this.pending.filter((entry) => entry.id !== requestId);
    this.friendsOf.add(request.fromUserId);
    const friend = this.users.find((user) => user.id === request.fromUserId);
    if (!friend) throw new Error("User not found");
    friend.isFriend = true;
    this.events.emit("friend_accepted", { requestId, friend });
    return { ...friend, isFriend: true };
  }

  rejectFriendRequest(requestId: string): string {
    const request = this.pending.find((entry) => entry.id === requestId);
    if (!request) throw new Error("Request not found");
    request.status = "rejected";
    this.pending = this.pending.filter((entry) => entry.id !== requestId);
    return requestId;
  }

  searchUsers(query: string): SocialFriend[] {
    const needle = query.trim().toLowerCase();
    if (needle.length < 2) return [];
    return this.users
      .filter((user) => user.id !== CURRENT_USER_ID && user.displayName.toLowerCase().includes(needle))
      .map((user) => ({ ...user, isFriend: this.friendsOf.has(user.id) }));
  }

  getChatHistory(channel: ChatChannel): ChatMessage[] {
    return this.messages.filter((message) => message.channel === channel).map((message) => ({ ...message }));
  }

  sendMessage(input: Omit<ChatMessage, "id" | "timestamp" | "read">): ChatMessage {
    const content = input.content.trim();
    if (!content) throw new Error("Message cannot be empty");
    const message: ChatMessage = {
      ...input,
      content,
      id: this.id(),
      timestamp: this.now(),
      read: true,
    };
    this.messages.push(message);
    this.events.emit("chat_message", message);
    return { ...message };
  }

  receiveMessage(message: ChatMessage): ChatMessage {
    if (!this.messages.some((entry) => entry.id === message.id)) {
      this.messages.push(message);
    }
    return { ...message };
  }

  getGuilds(): SocialGuild[] {
    return this.guilds.map((guild) => this.withCount({ ...guild, members: guild.members.map((member) => ({ ...member })) }));
  }

  getMyGuild(): SocialGuild | null {
    if (!this.membership) return null;
    const guild = this.guilds.find((entry) => entry.id === this.membership);
    return guild ? this.withCount({ ...guild, members: guild.members.map((member) => ({ ...member })) }) : null;
  }

  createGuild(data: { name: string; tag: string; description: string }): SocialGuild {
    const name = data.name.trim();
    const tag = data.tag.trim().toUpperCase();
    if (!name) throw new Error("Name and tag are required");
    if (tag.length < 2 || tag.length > 5) throw new Error("Tag must be 2-5 characters");
    if (this.membership) throw new Error("Already in a guild");
    if (this.guilds.some((guild) => guild.tag === tag || guild.name.toLowerCase() === name.toLowerCase())) {
      throw new Error("Guild name or tag already exists");
    }
    const guild: SocialGuild = {
      id: this.id(),
      name,
      tag,
      description: data.description.trim(),
      leaderId: CURRENT_USER_ID,
      reputation: 0,
      memberCount: 1,
      createdAt: this.now(),
      members: [
        {
          userId: CURRENT_USER_ID,
          displayName: CURRENT_USER_NAME,
          avatarUrl: "",
          role: "leader",
          joinedAt: this.now(),
        },
      ],
    };
    this.guilds.push(guild);
    this.membership = guild.id;
    this.events.emit("guild_joined", guild);
    return this.withCount(guild);
  }

  joinGuild(guildId: string): SocialGuild {
    if (this.membership) throw new Error("Already in a guild");
    const guild = this.guilds.find((entry) => entry.id === guildId);
    if (!guild) throw new Error("Guild not found");
    if (guild.members.some((member) => member.userId === CURRENT_USER_ID)) {
      this.membership = guild.id;
      return this.withCount(guild);
    }
    guild.members.push({
      userId: CURRENT_USER_ID,
      displayName: CURRENT_USER_NAME,
      avatarUrl: "",
      role: "member",
      joinedAt: this.now(),
    });
    this.membership = guild.id;
    this.events.emit("guild_joined", guild);
    return this.withCount(guild);
  }

  leaveGuild(): null {
    if (!this.membership) return null;
    const guild = this.guilds.find((entry) => entry.id === this.membership);
    if (guild) {
      guild.members = guild.members.filter((member) => member.userId !== CURRENT_USER_ID);
      if (guild.leaderId === CURRENT_USER_ID) {
        const nextLeader = guild.members[0];
        if (nextLeader) {
          nextLeader.role = "leader";
          guild.leaderId = nextLeader.userId;
        }
      }
    }
    this.membership = null;
    this.events.emit("guild_left", { userId: CURRENT_USER_ID });
    return null;
  }

  getFeed(page = 1, limit = 20): FeedPage {
    const safePage = Math.max(1, page);
    const start = (safePage - 1) * limit;
    const slice = this.feed.slice(start, start + limit).map((item) => ({
      ...item,
      details: { ...item.details },
      liked: this.liked.has(item.id),
    }));
    return { items: slice, page: safePage, hasMore: start + limit < this.feed.length };
  }

  likeFeedItem(itemId: string): string {
    const item = this.feed.find((entry) => entry.id === itemId);
    if (!item) throw new Error("Feed item not found");
    if (this.liked.has(itemId)) {
      this.liked.delete(itemId);
      item.liked = false;
      item.likes = Math.max(0, item.likes - 1);
    } else {
      this.liked.add(itemId);
      item.liked = true;
      item.likes += 1;
    }
    return itemId;
  }

  getLeaderboard(filter: LeaderboardFilter = "global"): SocialLeaderboardEntry[] {
    const friendIds = new Set(this.friendsOf);
    const myGuild = this.getMyGuild();
    const guildMemberIds = new Set((myGuild?.members ?? []).map((member) => member.userId));
    return filterLeaderboard(this.leaderboard, filter, friendIds, guildMemberIds, CURRENT_USER_ID);
  }

  setPresence(userId: string, status: PresenceStatus): void {
    const user = this.users.find((entry) => entry.id === userId);
    if (!user) return;
    user.status = status;
    user.lastSeen = this.now();
    this.events.emit("presence", { userId, status });
  }

  private withCount(guild: SocialGuild): SocialGuild {
    return { ...guild, memberCount: guild.members.length };
  }
}

let shared: SocialService | null = null;

export function getSocialService(): SocialService {
  if (!shared) shared = new SocialService();
  return shared;
}

export function resetSocialService(instance?: SocialService): SocialService {
  shared = instance ?? new SocialService();
  return shared;
}
