import {
  chatReducer,
  feedReducer,
  friendReducer,
  guildReducer,
  initialChatState,
  initialFeedState,
  initialFriendState,
  initialGuildState,
  initialLeaderboardState,
  leaderboardReducer,
  type ChatAction,
  type FeedActionType,
  type FriendAction,
  type GuildAction,
  type LeaderboardAction,
} from "./reducers";
import { SocialAPI } from "./SocialAPI";
import { errorMessage } from "./time";
import type { ChatChannel, ChatMessage, LeaderboardFilter, SocialSnapshot } from "./types";
import { CURRENT_USER_ID, CURRENT_USER_NAME } from "./types";
import { WebSocketService } from "./WebSocketService";

type SocialAction = FriendAction | ChatAction | GuildAction | FeedActionType | LeaderboardAction;

function createSnapshot(): SocialSnapshot {
  return {
    currentUserId: CURRENT_USER_ID,
    currentUserName: CURRENT_USER_NAME,
    friend: initialFriendState,
    chat: initialChatState,
    guild: initialGuildState,
    feed: initialFeedState,
    leaderboard: initialLeaderboardState,
  };
}

export class SocialStore {
  private snapshot = createSnapshot();
  private listeners = new Set<() => void>();
  private unsubscribeChat: (() => void) | null = null;

  constructor() {
    this.bindRealtime();
  }

  getState = (): SocialSnapshot => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  dispatch(action: SocialAction): void {
    const next: SocialSnapshot = {
      ...this.snapshot,
      friend: friendReducer(this.snapshot.friend, action as FriendAction),
      chat: chatReducer(this.snapshot.chat, action as ChatAction),
      guild: guildReducer(this.snapshot.guild, action as GuildAction),
      feed: feedReducer(this.snapshot.feed, action as FeedActionType),
      leaderboard: leaderboardReducer(this.snapshot.leaderboard, action as LeaderboardAction),
    };
    this.snapshot = next;
    for (const listener of this.listeners) listener();
  }

  private async run<T>(
    work: () => Promise<T>,
    onSuccess: (value: T) => SocialAction,
    onError: (message: string) => SocialAction,
  ): Promise<void> {
    try {
      this.dispatch(onSuccess(await work()));
    } catch (error) {
      this.dispatch(onError(errorMessage(error)));
    }
  }

  async fetchFriends(): Promise<void> {
    this.dispatch({ type: "friend/fetch/pending" });
    await this.run(
      () => SocialAPI.getFriends(),
      (payload) => ({ type: "friend/fetch/fulfilled", payload }),
      (payload) => ({ type: "friend/fetch/rejected", payload }),
    );
  }

  async fetchFriendRequests(): Promise<void> {
    await this.run(
      () => SocialAPI.getFriendRequests(),
      (payload) => ({ type: "friend/requests/fulfilled", payload }),
      (payload) => ({ type: "friend/fetch/rejected", payload }),
    );
  }

  async sendFriendRequest(userId: string): Promise<void> {
    await this.run(
      () => SocialAPI.sendFriendRequest(userId),
      (payload) => ({ type: "friend/send/fulfilled", payload }),
      (payload) => ({ type: "friend/fetch/rejected", payload }),
    );
  }

  async acceptFriendRequest(requestId: string): Promise<void> {
    await this.run(
      () => SocialAPI.acceptFriendRequest(requestId),
      (friend) => ({ type: "friend/accept/fulfilled", payload: { requestId, friend } }),
      (payload) => ({ type: "friend/fetch/rejected", payload }),
    );
  }

  async rejectFriendRequest(requestId: string): Promise<void> {
    await this.run(
      () => SocialAPI.rejectFriendRequest(requestId),
      (payload) => ({ type: "friend/reject/fulfilled", payload }),
      (payload) => ({ type: "friend/fetch/rejected", payload }),
    );
  }

  async searchUsers(query: string): Promise<void> {
    if (query.trim().length < 2) {
      this.dispatch({ type: "friend/clearSearch" });
      return;
    }
    await this.run(
      () => SocialAPI.searchUsers(query),
      (payload) => ({ type: "friend/search/fulfilled", payload }),
      (payload) => ({ type: "friend/fetch/rejected", payload }),
    );
  }

  clearSearch(): void {
    this.dispatch({ type: "friend/clearSearch" });
  }

  async fetchChatHistory(channel: ChatChannel): Promise<void> {
    this.dispatch({ type: "chat/fetch/pending" });
    this.dispatch({ type: "chat/setActive", payload: channel });
    await this.run(
      () => SocialAPI.getChatHistory(channel),
      (payload) => ({ type: "chat/fetch/fulfilled", payload }),
      (payload) => ({ type: "chat/fetch/rejected", payload }),
    );
  }

  async sendChat(input: Omit<ChatMessage, "id" | "timestamp" | "read">): Promise<void> {
    await this.run(
      () => SocialAPI.sendMessage(input),
      (payload) => ({ type: "chat/send/fulfilled", payload }),
      (payload) => ({ type: "chat/fetch/rejected", payload }),
    );
  }

  markChannelRead(channel: string): void {
    this.dispatch({ type: "chat/markRead", payload: channel });
  }

  async fetchMyGuild(): Promise<void> {
    this.dispatch({ type: "guild/fetchMy/pending" });
    await this.run(
      () => SocialAPI.getMyGuild(),
      (payload) => ({ type: "guild/fetchMy/fulfilled", payload }),
      (payload) => ({ type: "guild/fetchMy/rejected", payload }),
    );
  }

  async fetchGuilds(): Promise<void> {
    await this.run(
      () => SocialAPI.getGuilds(),
      (payload) => ({ type: "guild/fetchAll/fulfilled", payload }),
      (payload) => ({ type: "guild/fetchMy/rejected", payload }),
    );
  }

  async createGuild(data: { name: string; tag: string; description: string }): Promise<void> {
    await this.run(
      () => SocialAPI.createGuild(data),
      (payload) => ({ type: "guild/create/fulfilled", payload }),
      (payload) => ({ type: "guild/fetchMy/rejected", payload }),
    );
  }

  async joinGuild(guildId: string): Promise<void> {
    await this.run(
      () => SocialAPI.joinGuild(guildId),
      (payload) => ({ type: "guild/join/fulfilled", payload }),
      (payload) => ({ type: "guild/fetchMy/rejected", payload }),
    );
  }

  async leaveGuild(): Promise<void> {
    await this.run(
      () => SocialAPI.leaveGuild(),
      () => ({ type: "guild/leave/fulfilled" }),
      (payload) => ({ type: "guild/fetchMy/rejected", payload }),
    );
  }

  async fetchFeed(page = 1): Promise<void> {
    this.dispatch({ type: "feed/fetch/pending" });
    await this.run(
      () => SocialAPI.getFeed(page),
      (payload) => ({ type: "feed/fetch/fulfilled", payload }),
      (payload) => ({ type: "feed/fetch/rejected", payload }),
    );
  }

  async likeFeedItem(itemId: string): Promise<void> {
    await this.run(
      () => SocialAPI.likeFeedItem(itemId),
      (payload) => ({ type: "feed/like/fulfilled", payload }),
      (payload) => ({ type: "feed/fetch/rejected", payload }),
    );
  }

  async fetchLeaderboard(filter: LeaderboardFilter = "global"): Promise<void> {
    this.dispatch({ type: "leaderboard/fetch/pending", payload: filter });
    await this.run(
      () => SocialAPI.getLeaderboard(filter),
      (entries) => ({ type: "leaderboard/fetch/fulfilled", payload: { filter, entries } }),
      (payload) => ({ type: "leaderboard/fetch/rejected", payload }),
    );
  }

  reset(): void {
    this.snapshot = createSnapshot();
    for (const listener of this.listeners) listener();
  }

  private bindRealtime(): void {
    this.unsubscribeChat?.();
    this.unsubscribeChat = WebSocketService.getInstance().onChatMessage((message) => {
      this.dispatch({ type: "chat/add", payload: message });
    });
  }
}

let sharedStore: SocialStore | null = null;

export function getSocialStore(): SocialStore {
  if (!sharedStore) sharedStore = new SocialStore();
  return sharedStore;
}

export function resetSocialStore(): SocialStore {
  sharedStore = new SocialStore();
  return sharedStore;
}
