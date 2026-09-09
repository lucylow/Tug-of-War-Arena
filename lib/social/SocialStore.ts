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

  async fetchFriends(): Promise<void> {
    this.dispatch({ type: "friend/fetch/pending" });
    try {
      const friends = await SocialAPI.getFriends();
      this.dispatch({ type: "friend/fetch/fulfilled", payload: friends });
    } catch (error) {
      this.dispatch({ type: "friend/fetch/rejected", payload: errorMessage(error) });
    }
  }

  async fetchFriendRequests(): Promise<void> {
    try {
      const requests = await SocialAPI.getFriendRequests();
      this.dispatch({ type: "friend/requests/fulfilled", payload: requests });
    } catch (error) {
      this.dispatch({ type: "friend/fetch/rejected", payload: errorMessage(error) });
    }
  }

  async sendFriendRequest(userId: string): Promise<void> {
    try {
      const request = await SocialAPI.sendFriendRequest(userId);
      this.dispatch({ type: "friend/send/fulfilled", payload: request });
    } catch (error) {
      this.dispatch({ type: "friend/fetch/rejected", payload: errorMessage(error) });
    }
  }

  async acceptFriendRequest(requestId: string): Promise<void> {
    try {
      const friend = await SocialAPI.acceptFriendRequest(requestId);
      this.dispatch({ type: "friend/accept/fulfilled", payload: { requestId, friend } });
    } catch (error) {
      this.dispatch({ type: "friend/fetch/rejected", payload: errorMessage(error) });
    }
  }

  async rejectFriendRequest(requestId: string): Promise<void> {
    try {
      const id = await SocialAPI.rejectFriendRequest(requestId);
      this.dispatch({ type: "friend/reject/fulfilled", payload: id });
    } catch (error) {
      this.dispatch({ type: "friend/fetch/rejected", payload: errorMessage(error) });
    }
  }

  async searchUsers(query: string): Promise<void> {
    if (query.trim().length < 2) {
      this.dispatch({ type: "friend/clearSearch" });
      return;
    }
    try {
      const results = await SocialAPI.searchUsers(query);
      this.dispatch({ type: "friend/search/fulfilled", payload: results });
    } catch (error) {
      this.dispatch({ type: "friend/fetch/rejected", payload: errorMessage(error) });
    }
  }

  clearSearch(): void {
    this.dispatch({ type: "friend/clearSearch" });
  }

  async fetchChatHistory(channel: ChatChannel): Promise<void> {
    this.dispatch({ type: "chat/fetch/pending" });
    this.dispatch({ type: "chat/setActive", payload: channel });
    try {
      const messages = await SocialAPI.getChatHistory(channel);
      this.dispatch({ type: "chat/fetch/fulfilled", payload: messages });
    } catch (error) {
      this.dispatch({ type: "chat/fetch/rejected", payload: errorMessage(error) });
    }
  }

  async sendChat(input: Omit<ChatMessage, "id" | "timestamp" | "read">): Promise<void> {
    try {
      const message = await SocialAPI.sendMessage(input);
      this.dispatch({ type: "chat/send/fulfilled", payload: message });
    } catch (error) {
      this.dispatch({ type: "chat/fetch/rejected", payload: errorMessage(error) });
    }
  }

  markChannelRead(channel: string): void {
    this.dispatch({ type: "chat/markRead", payload: channel });
  }

  async fetchMyGuild(): Promise<void> {
    this.dispatch({ type: "guild/fetchMy/pending" });
    try {
      const guild = await SocialAPI.getMyGuild();
      this.dispatch({ type: "guild/fetchMy/fulfilled", payload: guild });
    } catch (error) {
      this.dispatch({ type: "guild/fetchMy/rejected", payload: errorMessage(error) });
    }
  }

  async fetchGuilds(): Promise<void> {
    try {
      const guilds = await SocialAPI.getGuilds();
      this.dispatch({ type: "guild/fetchAll/fulfilled", payload: guilds });
    } catch (error) {
      this.dispatch({ type: "guild/fetchMy/rejected", payload: errorMessage(error) });
    }
  }

  async createGuild(data: { name: string; tag: string; description: string }): Promise<void> {
    try {
      const guild = await SocialAPI.createGuild(data);
      this.dispatch({ type: "guild/create/fulfilled", payload: guild });
    } catch (error) {
      this.dispatch({ type: "guild/fetchMy/rejected", payload: errorMessage(error) });
    }
  }

  async joinGuild(guildId: string): Promise<void> {
    try {
      const guild = await SocialAPI.joinGuild(guildId);
      this.dispatch({ type: "guild/join/fulfilled", payload: guild });
    } catch (error) {
      this.dispatch({ type: "guild/fetchMy/rejected", payload: errorMessage(error) });
    }
  }

  async leaveGuild(): Promise<void> {
    try {
      await SocialAPI.leaveGuild();
      this.dispatch({ type: "guild/leave/fulfilled" });
    } catch (error) {
      this.dispatch({ type: "guild/fetchMy/rejected", payload: errorMessage(error) });
    }
  }

  async fetchFeed(page = 1): Promise<void> {
    this.dispatch({ type: "feed/fetch/pending" });
    try {
      const payload = await SocialAPI.getFeed(page);
      this.dispatch({ type: "feed/fetch/fulfilled", payload });
    } catch (error) {
      this.dispatch({ type: "feed/fetch/rejected", payload: errorMessage(error) });
    }
  }

  async likeFeedItem(itemId: string): Promise<void> {
    try {
      const id = await SocialAPI.likeFeedItem(itemId);
      this.dispatch({ type: "feed/like/fulfilled", payload: id });
    } catch (error) {
      this.dispatch({ type: "feed/fetch/rejected", payload: errorMessage(error) });
    }
  }

  async fetchLeaderboard(filter: LeaderboardFilter = "global"): Promise<void> {
    this.dispatch({ type: "leaderboard/fetch/pending", payload: filter });
    try {
      const entries = await SocialAPI.getLeaderboard(filter);
      this.dispatch({ type: "leaderboard/fetch/fulfilled", payload: { filter, entries } });
    } catch (error) {
      this.dispatch({ type: "leaderboard/fetch/rejected", payload: errorMessage(error) });
    }
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
