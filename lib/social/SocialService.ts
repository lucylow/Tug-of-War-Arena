import { MockEventEmitter } from "@/lib/mock/emitter";

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
import { filterLeaderboard } from "./reducers";

type IdFactory = () => string;

const DIRECTORY: SocialFriend[] = [
  { id: CURRENT_USER_ID, displayName: CURRENT_USER_NAME, avatarUrl: "", status: "online", lastSeen: "2026-09-09T00:00:00.000Z", level: 4, wins: 8, isFriend: false },
  { id: "novanina", displayName: "NovaNina", avatarUrl: "", status: "online", lastSeen: "2026-09-09T00:40:00.000Z", level: 6, wins: 12, isFriend: true },
  { id: "pixelpuller", displayName: "PixelPuller", avatarUrl: "", status: "in-game", lastSeen: "2026-09-09T00:41:00.000Z", level: 5, wins: 15, isFriend: true },
  { id: "moonrunner", displayName: "MoonRunner", avatarUrl: "", status: "online", lastSeen: "2026-09-09T00:30:00.000Z", level: 4, wins: 7, isFriend: true },
  { id: "sunspark", displayName: "SunSpark", avatarUrl: "", status: "away", lastSeen: "2026-09-08T23:50:00.000Z", level: 3, wins: 6, isFriend: true },
  { id: "roperanger", displayName: "RopeRanger", avatarUrl: "", status: "offline", lastSeen: "2026-09-08T22:10:00.000Z", level: 8, wins: 18, isFriend: true },
  { id: "torquekid", displayName: "TorqueKid", avatarUrl: "", status: "offline", lastSeen: "2026-09-08T21:12:00.000Z", level: 3, wins: 5, isFriend: true },
  { id: "manamax", displayName: "ManaMax", avatarUrl: "", status: "online", lastSeen: "2026-09-09T00:20:00.000Z", level: 5, wins: 9, isFriend: false },
  { id: "decentradeb", displayName: "DecentraDeb", avatarUrl: "", status: "in-game", lastSeen: "2026-09-09T00:38:00.000Z", level: 4, wins: 4, isFriend: false },
  { id: "orbitace", displayName: "OrbitAce", avatarUrl: "", status: "away", lastSeen: "2026-09-08T23:10:00.000Z", level: 2, wins: 3, isFriend: false },
  { id: "neontug", displayName: "NeonTug", avatarUrl: "", status: "online", lastSeen: "2026-09-09T00:15:00.000Z", level: 2, wins: 2, isFriend: false },
];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
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
    this.users = clone(DIRECTORY);
    this.friendsOf = new Set(DIRECTORY.filter((user) => user.isFriend).map((user) => user.id));
    this.pending = [
      {
        id: "req_orbitace",
        fromUserId: "orbitace",
        fromDisplayName: "OrbitAce",
        fromAvatarUrl: "",
        sentAt: "2026-09-08T18:00:00.000Z",
        status: "pending",
        toUserId: CURRENT_USER_ID,
      },
    ];
    this.sent = [];
    this.messages = [
      {
        id: "msg_1",
        senderId: "novanina",
        senderName: "NovaNina",
        senderAvatar: "",
        content: "Sun Crew lounge is open — who is pulling first?",
        timestamp: "2026-09-09T00:10:00.000Z",
        channel: "global",
        read: true,
      },
      {
        id: "msg_2",
        senderId: "pixelpuller",
        senderName: "PixelPuller",
        senderAvatar: "",
        content: "Moon side is stacked. Run it back after Plaza Sprint.",
        timestamp: "2026-09-09T00:12:00.000Z",
        channel: "global",
        read: true,
      },
      {
        id: "msg_3",
        senderId: "moonrunner",
        senderName: "MoonRunner",
        senderAvatar: "",
        content: "Party chat ready. Bring the surge.",
        timestamp: "2026-09-09T00:14:00.000Z",
        channel: "party",
        read: false,
      },
    ];
    this.guilds = [
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
          { userId: "novanina", displayName: "NovaNina", avatarUrl: "", role: "leader", joinedAt: "2026-08-01T00:00:00.000Z" },
          { userId: "sunspark", displayName: "SunSpark", avatarUrl: "", role: "officer", joinedAt: "2026-08-12T00:00:00.000Z" },
          { userId: "roperanger", displayName: "RopeRanger", avatarUrl: "", role: "member", joinedAt: "2026-08-20T00:00:00.000Z" },
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
          { userId: "pixelpuller", displayName: "PixelPuller", avatarUrl: "", role: "leader", joinedAt: "2026-08-02T00:00:00.000Z" },
          { userId: "moonrunner", displayName: "MoonRunner", avatarUrl: "", role: "officer", joinedAt: "2026-08-14T00:00:00.000Z" },
          { userId: "torquekid", displayName: "TorqueKid", avatarUrl: "", role: "member", joinedAt: "2026-08-22T00:00:00.000Z" },
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
          { userId: "manamax", displayName: "ManaMax", avatarUrl: "", role: "leader", joinedAt: "2026-08-18T00:00:00.000Z" },
          { userId: "decentradeb", displayName: "DecentraDeb", avatarUrl: "", role: "member", joinedAt: "2026-08-19T00:00:00.000Z" },
        ],
      },
    ];
    this.membership = null;
    this.feed = [
      {
        id: "feed_1",
        userId: "novanina",
        displayName: "NovaNina",
        avatarUrl: "",
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
        avatarUrl: "",
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
        avatarUrl: "",
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
        avatarUrl: "",
        action: "friend_added",
        details: { friendName: "MoonRunner" },
        timestamp: "2026-09-08T19:00:00.000Z",
        likes: 1,
        liked: true,
      },
    ];
    this.liked = new Set(["feed_4"]);
    this.leaderboard = [
      { userId: "roperanger", displayName: "RopeRanger", avatarUrl: "", wins: 18, taps: 842, reputation: 90, rank: 1 },
      { userId: "pixelpuller", displayName: "PixelPuller", avatarUrl: "", wins: 15, taps: 716, reputation: 82, rank: 2 },
      { userId: "novanina", displayName: "NovaNina", avatarUrl: "", wins: 12, taps: 644, reputation: 76, rank: 3 },
      { userId: CURRENT_USER_ID, displayName: CURRENT_USER_NAME, avatarUrl: "", wins: 8, taps: 503, reputation: 54, rank: 4 },
      { userId: "moonrunner", displayName: "MoonRunner", avatarUrl: "", wins: 7, taps: 481, reputation: 48, rank: 5 },
      { userId: "sunspark", displayName: "SunSpark", avatarUrl: "", wins: 6, taps: 438, reputation: 44, rank: 6 },
      { userId: "torquekid", displayName: "TorqueKid", avatarUrl: "", wins: 5, taps: 392, reputation: 38, rank: 7 },
      { userId: "manamax", displayName: "ManaMax", avatarUrl: "", wins: 4, taps: 327, reputation: 33, rank: 8 },
    ];
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
