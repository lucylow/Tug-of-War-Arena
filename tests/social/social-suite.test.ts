import { afterEach, describe, expect, it } from "vitest";

import { appRouter } from "../../server/routers";
import type { TrpcContext } from "../../server/_core/context";
import {
  chatReducer,
  feedReducer,
  filterLeaderboard,
  friendReducer,
  guildReducer,
  initialChatState,
  initialFeedState,
  initialFriendState,
  initialGuildState,
  visibleChatMessages,
} from "../../lib/social/reducers";
import { SocialService, resetSocialService } from "../../lib/social/SocialService";
import { SocialAPI } from "../../lib/social/SocialAPI";
import { resetSocialStore } from "../../lib/social/SocialStore";
import { fromNow } from "../../lib/social/time";
import { CURRENT_USER_ID } from "../../lib/social/types";
import { WebSocketService } from "../../lib/social/WebSocketService";
import { getSocialOverlayLayout, isSocialOverlayInSafeBand } from "../../scene/src/logic/socialLayout";
import { SOCIAL_REPUTATION_ABI } from "../../lib/web3/abi";
import { getSocialReputationAddress } from "../../lib/web3/config";
import { POLYGON_AMOY_CHAIN_ID } from "../../lib/web3/addresses";

afterEach(() => {
  resetSocialService();
  resetSocialStore();
  WebSocketService.resetForTests();
});

describe("friendReducer", () => {
  it("handles fetchFriends.fulfilled", () => {
    const state = friendReducer(
      { ...initialFriendState, loading: true },
      { type: "friend/fetch/fulfilled", payload: [{ id: "1", displayName: "Test", avatarUrl: "", status: "online", lastSeen: "", level: 1, wins: 0, isFriend: true }] },
    );
    expect(state.loading).toBe(false);
    expect(state.friends).toHaveLength(1);
    expect(state.onlineUsers).toEqual(["1"]);
  });

  it("accepts a pending request and adds the friend", () => {
    const pending = {
      id: "req_1",
      fromUserId: "nova",
      fromDisplayName: "NovaNina",
      fromAvatarUrl: "",
      sentAt: "2026-09-08T00:00:00.000Z",
      status: "pending" as const,
    };
    const start = friendReducer(
      { ...initialFriendState, pendingRequests: [pending] },
      {
        type: "friend/accept/fulfilled",
        payload: {
          requestId: "req_1",
          friend: { id: "nova", displayName: "NovaNina", avatarUrl: "", status: "online", lastSeen: "", level: 1, wins: 2, isFriend: true },
        },
      },
    );
    expect(start.pendingRequests).toHaveLength(0);
    expect(start.friends[0]?.id).toBe("nova");
  });
});

describe("chatReducer", () => {
  it("tracks unread messages and marks a channel read", () => {
    const withMessage = chatReducer(initialChatState, {
      type: "chat/add",
      payload: {
        id: "m1",
        senderId: "nova",
        senderName: "NovaNina",
        senderAvatar: "",
        content: "hello",
        timestamp: "2026-09-09T00:00:00.000Z",
        channel: "global",
        read: false,
      },
    });
    expect(withMessage.unreadCount).toBe(1);
    const read = chatReducer(withMessage, { type: "chat/markRead", payload: "global" });
    expect(read.unreadCount).toBe(0);
    expect(read.messages[0]?.read).toBe(true);
  });

  it("filters direct messages by recipient", () => {
    const messages = [
      { id: "1", senderId: "you", senderName: "You", senderAvatar: "", content: "hi", timestamp: "", channel: "direct" as const, recipientId: "nova", read: true },
      { id: "2", senderId: "nova", senderName: "NovaNina", senderAvatar: "", content: "yo", timestamp: "", channel: "direct" as const, recipientId: "you", read: true },
      { id: "3", senderId: "pixel", senderName: "Pixel", senderAvatar: "", content: "nope", timestamp: "", channel: "global" as const, read: true },
    ];
    expect(visibleChatMessages(messages, "direct", "nova")).toHaveLength(2);
    expect(visibleChatMessages(messages, "global")).toHaveLength(1);
  });
});

describe("guildReducer and feedReducer", () => {
  it("joins and leaves a guild", () => {
    const guild = {
      id: "guild_sun",
      name: "Sun Crew",
      tag: "SUN",
      description: "",
      leaderId: "nova",
      members: [],
      reputation: 10,
      memberCount: 1,
      createdAt: "",
    };
    const joined = guildReducer(initialGuildState, { type: "guild/join/fulfilled", payload: guild });
    expect(joined.myGuild?.tag).toBe("SUN");
    expect(guildReducer(joined, { type: "guild/leave/fulfilled" }).myGuild).toBeNull();
  });

  it("appends later feed pages and toggles likes", () => {
    const page1 = feedReducer(initialFeedState, {
      type: "feed/fetch/fulfilled",
      payload: {
        page: 1,
        hasMore: true,
        items: [{ id: "a", userId: "1", displayName: "A", avatarUrl: "", action: "match_won", details: {}, timestamp: "", likes: 1, liked: false }],
      },
    });
    const page2 = feedReducer(page1, {
      type: "feed/fetch/fulfilled",
      payload: {
        page: 2,
        hasMore: false,
        items: [{ id: "b", userId: "2", displayName: "B", avatarUrl: "", action: "match_lost", details: {}, timestamp: "", likes: 0, liked: false }],
      },
    });
    expect(page2.items.map((item) => item.id)).toEqual(["a", "b"]);
    const liked = feedReducer(page2, { type: "feed/like/fulfilled", payload: "a" });
    expect(liked.items[0]?.liked).toBe(true);
    expect(liked.items[0]?.likes).toBe(2);
  });
});

describe("SocialService", () => {
  it("seeds friends and accepts a pending request", () => {
    const social = new SocialService();
    expect(social.getFriends().length).toBeGreaterThan(3);
    const accepted = social.acceptFriendRequest("req_orbitace");
    expect(accepted.id).toBe("orbitace");
    expect(social.getFriends().some((friend) => friend.id === "orbitace")).toBe(true);
    expect(social.getFriendRequests()).toHaveLength(0);
  });

  it("creates, joins, and leaves guilds with tag validation", () => {
    const social = new SocialService({ id: () => "guild_custom" });
    expect(() => social.createGuild({ name: "X", tag: "Z", description: "" })).toThrow(/2-5/);
    const created = social.createGuild({ name: "Relay Kings", tag: "RK", description: "Plaza crew" });
    expect(created.leaderId).toBe(CURRENT_USER_ID);
    expect(social.getMyGuild()?.tag).toBe("RK");
    social.leaveGuild();
    expect(social.getMyGuild()).toBeNull();
    const joined = social.joinGuild("guild_sun");
    expect(joined.members.some((member) => member.userId === CURRENT_USER_ID)).toBe(true);
  });

  it("sends chat and filters leaderboards", async () => {
    resetSocialService(new SocialService({ id: () => "msg_new", now: () => "2026-09-09T01:00:00.000Z" }));
    const sent = await SocialAPI.sendMessage({
      senderId: CURRENT_USER_ID,
      senderName: "You",
      senderAvatar: "",
      content: "Pull!",
      channel: "global",
    });
    expect(sent.id).toBe("msg_new");
    const friendsBoard = await SocialAPI.getLeaderboard("friends");
    expect(friendsBoard.some((entry) => entry.userId === CURRENT_USER_ID)).toBe(true);
    expect(friendsBoard.every((entry) => entry.userId === CURRENT_USER_ID || entry.rank >= 1)).toBe(true);
    const guildBoard = await SocialAPI.getLeaderboard("guild");
    expect(guildBoard).toEqual([]);
  });
});

describe("tRPC social router", () => {
  it("lists seeded friends without auth", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: { headers: {} },
      res: {},
    } as TrpcContext);
    const friends = await caller.social.friends();
    expect(friends.some((friend) => friend.displayName === "NovaNina")).toBe(true);
    const feed = await caller.social.feed({ page: 1 });
    expect(feed.items.length).toBeGreaterThan(0);
    expect(feed.hasMore).toBe(false);
  });
});

describe("leaderboard filter helper", () => {
  it("scopes friends and guild views", () => {
    const entries = [
      { userId: "you", displayName: "You", avatarUrl: "", wins: 8, taps: 1, reputation: 1, rank: 1 },
      { userId: "nova", displayName: "Nova", avatarUrl: "", wins: 4, taps: 1, reputation: 1, rank: 2 },
      { userId: "stranger", displayName: "X", avatarUrl: "", wins: 2, taps: 1, reputation: 1, rank: 3 },
    ];
    const friends = filterLeaderboard(entries, "friends", new Set(["nova"]), new Set(), "you");
    expect(friends.map((entry) => entry.userId)).toEqual(["you", "nova"]);
    const guild = filterLeaderboard(entries, "guild", new Set(), new Set(["nova"]), "you");
    expect(guild.map((entry) => entry.userId)).toEqual(["nova"]);
  });
});

describe("social overlay layout", () => {
  it("keeps the mobile crew icon inside the DCL safe band", () => {
    const mobile = getSocialOverlayLayout(true);
    expect(isSocialOverlayInSafeBand(mobile.leftPercent, mobile.topPercent, true)).toBe(true);
    expect(mobile.width).toBeGreaterThanOrEqual(44);
    const desktop = getSocialOverlayLayout(false);
    expect(desktop.leftPercent).toBeGreaterThan(60);
  });
});

describe("relative time and reputation ABI", () => {
  it("formats recent timestamps", () => {
    const now = Date.parse("2026-09-09T12:00:00.000Z");
    expect(fromNow("2026-09-09T11:59:30.000Z", now)).toBe("just now");
    expect(fromNow("2026-09-09T11:10:00.000Z", now)).toBe("50m ago");
  });

  it("exposes follow and metadata writes for the live reputation contract", () => {
    expect(SOCIAL_REPUTATION_ABI.some((item) => item.includes("follow("))).toBe(true);
    expect(SOCIAL_REPUTATION_ABI.some((item) => item.includes("setMetadata"))).toBe(true);
    expect(getSocialReputationAddress(POLYGON_AMOY_CHAIN_ID)).toBe("");
  });
});
