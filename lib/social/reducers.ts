import type {
  ChatMessage,
  ChatState,
  FeedItem,
  FeedPage,
  FeedState,
  FriendRequest,
  FriendState,
  GuildState,
  LeaderboardFilter,
  LeaderboardState,
  PresenceStatus,
  SocialFriend,
  SocialGuild,
  SocialLeaderboardEntry,
} from "./types";

export const initialFriendState: FriendState = {
  friends: [],
  pendingRequests: [],
  sentRequests: [],
  onlineUsers: [],
  searchResults: [],
  loading: false,
  error: null,
};

export const initialChatState: ChatState = {
  messages: [],
  unreadCount: 0,
  activeChannel: null,
  loading: false,
  error: null,
};

export const initialGuildState: GuildState = {
  myGuild: null,
  guilds: [],
  loading: false,
  error: null,
};

export const initialFeedState: FeedState = {
  items: [],
  loading: false,
  error: null,
  page: 0,
  hasMore: true,
};

export const initialLeaderboardState: LeaderboardState = {
  entries: [],
  filter: "global",
  loading: false,
  error: null,
};

export type FriendAction =
  | { type: "friend/fetch/pending" }
  | { type: "friend/fetch/fulfilled"; payload: SocialFriend[] }
  | { type: "friend/fetch/rejected"; payload: string }
  | { type: "friend/requests/fulfilled"; payload: FriendRequest[] }
  | { type: "friend/send/fulfilled"; payload: FriendRequest }
  | { type: "friend/accept/fulfilled"; payload: { requestId: string; friend: SocialFriend } }
  | { type: "friend/reject/fulfilled"; payload: string }
  | { type: "friend/search/fulfilled"; payload: SocialFriend[] }
  | { type: "friend/setOnlineStatus"; payload: { userId: string; status: PresenceStatus } }
  | { type: "friend/add"; payload: SocialFriend }
  | { type: "friend/remove"; payload: string }
  | { type: "friend/addPending"; payload: FriendRequest }
  | { type: "friend/removePending"; payload: string }
  | { type: "friend/clearSearch" };

export type ChatAction =
  | { type: "chat/fetch/pending" }
  | { type: "chat/fetch/fulfilled"; payload: ChatMessage[] }
  | { type: "chat/fetch/rejected"; payload: string }
  | { type: "chat/send/fulfilled"; payload: ChatMessage }
  | { type: "chat/add"; payload: ChatMessage }
  | { type: "chat/markRead"; payload: string }
  | { type: "chat/setActive"; payload: string | null }
  | { type: "chat/clear" };

export type GuildAction =
  | { type: "guild/fetchMy/pending" }
  | { type: "guild/fetchMy/fulfilled"; payload: SocialGuild | null }
  | { type: "guild/fetchMy/rejected"; payload: string }
  | { type: "guild/fetchAll/fulfilled"; payload: SocialGuild[] }
  | { type: "guild/create/fulfilled"; payload: SocialGuild }
  | { type: "guild/join/fulfilled"; payload: SocialGuild }
  | { type: "guild/leave/fulfilled" }
  | { type: "guild/clearError" };

export type FeedActionType =
  | { type: "feed/fetch/pending" }
  | { type: "feed/fetch/fulfilled"; payload: FeedPage }
  | { type: "feed/fetch/rejected"; payload: string }
  | { type: "feed/like/fulfilled"; payload: string }
  | { type: "feed/clear" };

export type LeaderboardAction =
  | { type: "leaderboard/fetch/pending"; payload: LeaderboardFilter }
  | { type: "leaderboard/fetch/fulfilled"; payload: { filter: LeaderboardFilter; entries: SocialLeaderboardEntry[] } }
  | { type: "leaderboard/fetch/rejected"; payload: string };

export function friendReducer(state: FriendState, action: FriendAction): FriendState {
  switch (action.type) {
    case "friend/fetch/pending":
      return { ...state, loading: true, error: null };
    case "friend/fetch/fulfilled":
      return {
        ...state,
        loading: false,
        friends: action.payload,
        onlineUsers: action.payload.filter((friend) => friend.status === "online" || friend.status === "in-game").map((friend) => friend.id),
      };
    case "friend/fetch/rejected":
      return { ...state, loading: false, error: action.payload };
    case "friend/requests/fulfilled":
      return { ...state, pendingRequests: action.payload };
    case "friend/send/fulfilled": {
      const already = state.sentRequests.some((request) => request.id === action.payload.id);
      return already ? state : { ...state, sentRequests: [...state.sentRequests, action.payload] };
    }
    case "friend/accept/fulfilled":
      return {
        ...state,
        pendingRequests: state.pendingRequests.filter((request) => request.id !== action.payload.requestId),
        friends: state.friends.some((friend) => friend.id === action.payload.friend.id)
          ? state.friends
          : [...state.friends, action.payload.friend],
      };
    case "friend/reject/fulfilled":
      return {
        ...state,
        pendingRequests: state.pendingRequests.filter((request) => request.id !== action.payload),
      };
    case "friend/search/fulfilled":
      return { ...state, searchResults: action.payload };
    case "friend/setOnlineStatus": {
      const friends = state.friends.map((friend) =>
        friend.id === action.payload.userId ? { ...friend, status: action.payload.status } : friend,
      );
      const isOnline = action.payload.status === "online" || action.payload.status === "in-game";
      const onlineUsers = isOnline
        ? state.onlineUsers.includes(action.payload.userId)
          ? state.onlineUsers
          : [...state.onlineUsers, action.payload.userId]
        : state.onlineUsers.filter((id) => id !== action.payload.userId);
      return { ...state, friends, onlineUsers };
    }
    case "friend/add":
      if (state.friends.some((friend) => friend.id === action.payload.id)) return state;
      return { ...state, friends: [...state.friends, action.payload] };
    case "friend/remove":
      return { ...state, friends: state.friends.filter((friend) => friend.id !== action.payload) };
    case "friend/addPending":
      if (state.pendingRequests.some((request) => request.id === action.payload.id)) return state;
      return { ...state, pendingRequests: [...state.pendingRequests, action.payload] };
    case "friend/removePending":
      return { ...state, pendingRequests: state.pendingRequests.filter((request) => request.id !== action.payload) };
    case "friend/clearSearch":
      return { ...state, searchResults: [] };
    default:
      return state;
  }
}

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "chat/fetch/pending":
      return { ...state, loading: true, error: null };
    case "chat/fetch/fulfilled":
      return {
        ...state,
        loading: false,
        messages: action.payload,
        unreadCount: action.payload.filter((message) => !message.read).length,
      };
    case "chat/fetch/rejected":
      return { ...state, loading: false, error: action.payload };
    case "chat/send/fulfilled":
    case "chat/add": {
      if (state.messages.some((message) => message.id === action.payload.id)) return state;
      const unreadBump = !action.payload.read && action.payload.channel !== state.activeChannel ? 1 : 0;
      return {
        ...state,
        messages: [...state.messages, action.payload],
        unreadCount: state.unreadCount + unreadBump,
      };
    }
    case "chat/markRead": {
      const messages = state.messages.map((message) =>
        message.channel === action.payload || message.recipientId === action.payload ? { ...message, read: true } : message,
      );
      return { ...state, messages, unreadCount: messages.filter((message) => !message.read).length };
    }
    case "chat/setActive":
      return { ...state, activeChannel: action.payload };
    case "chat/clear":
      return { ...state, messages: [], unreadCount: 0 };
    default:
      return state;
  }
}

export function guildReducer(state: GuildState, action: GuildAction): GuildState {
  switch (action.type) {
    case "guild/fetchMy/pending":
      return { ...state, loading: true, error: null };
    case "guild/fetchMy/fulfilled":
      return { ...state, loading: false, myGuild: action.payload };
    case "guild/fetchMy/rejected":
      return { ...state, loading: false, error: action.payload };
    case "guild/fetchAll/fulfilled":
      return { ...state, guilds: action.payload };
    case "guild/create/fulfilled":
    case "guild/join/fulfilled":
      return { ...state, myGuild: action.payload, error: null };
    case "guild/leave/fulfilled":
      return { ...state, myGuild: null };
    case "guild/clearError":
      return { ...state, error: null };
    default:
      return state;
  }
}

export function feedReducer(state: FeedState, action: FeedActionType): FeedState {
  switch (action.type) {
    case "feed/fetch/pending":
      return { ...state, loading: true, error: null };
    case "feed/fetch/fulfilled": {
      const incoming = action.payload.items;
      const items =
        action.payload.page <= 1
          ? incoming
          : mergeUnique(state.items, incoming, (item) => item.id);
      return {
        ...state,
        loading: false,
        items,
        page: action.payload.page,
        hasMore: action.payload.hasMore,
      };
    }
    case "feed/fetch/rejected":
      return { ...state, loading: false, error: action.payload };
    case "feed/like/fulfilled": {
      const items = state.items.map((item) => {
        if (item.id !== action.payload) return item;
        const liked = !item.liked;
        return { ...item, liked, likes: item.likes + (liked ? 1 : -1) };
      });
      return { ...state, items };
    }
    case "feed/clear":
      return { ...initialFeedState };
    default:
      return state;
  }
}

export function leaderboardReducer(state: LeaderboardState, action: LeaderboardAction): LeaderboardState {
  switch (action.type) {
    case "leaderboard/fetch/pending":
      return { ...state, loading: true, error: null, filter: action.payload };
    case "leaderboard/fetch/fulfilled":
      return { ...state, loading: false, filter: action.payload.filter, entries: action.payload.entries };
    case "leaderboard/fetch/rejected":
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

export function filterLeaderboard(
  entries: SocialLeaderboardEntry[],
  filter: LeaderboardFilter,
  friendIds: ReadonlySet<string>,
  guildMemberIds: ReadonlySet<string>,
  currentUserId: string,
): SocialLeaderboardEntry[] {
  const filtered = entries.filter((entry) => {
    if (filter === "friends") return entry.userId === currentUserId || friendIds.has(entry.userId);
    if (filter === "guild") return guildMemberIds.has(entry.userId);
    return true;
  });
  return filtered.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

function mergeUnique<T>(existing: T[], incoming: T[], key: (item: T) => string): T[] {
  const seen = new Set(existing.map(key));
  const next = [...existing];
  for (const item of incoming) {
    const id = key(item);
    if (seen.has(id)) continue;
    seen.add(id);
    next.push(item);
  }
  return next;
}

export function visibleChatMessages(
  messages: ChatMessage[],
  channel: ChatMessage["channel"],
  recipientId?: string,
): ChatMessage[] {
  return messages.filter((message) => {
    if (message.channel !== channel) return false;
    if (channel !== "direct") return true;
    return message.recipientId === recipientId || message.senderId === recipientId;
  });
}

export type { FeedItem };
