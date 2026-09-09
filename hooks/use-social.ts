import { useCallback, useMemo, useSyncExternalStore } from "react";

import { getSocialStore } from "@/lib/social/SocialStore";
import type { ChatChannel, ChatMessage, LeaderboardFilter } from "@/lib/social/types";

export function useSocial() {
  const store = useMemo(() => getSocialStore(), []);
  const snapshot = useSyncExternalStore(store.subscribe, store.getState, store.getState);

  const fetchFriends = useCallback(() => store.fetchFriends(), [store]);
  const fetchFriendRequests = useCallback(() => store.fetchFriendRequests(), [store]);
  const sendFriendRequest = useCallback((userId: string) => store.sendFriendRequest(userId), [store]);
  const acceptFriendRequest = useCallback((requestId: string) => store.acceptFriendRequest(requestId), [store]);
  const rejectFriendRequest = useCallback((requestId: string) => store.rejectFriendRequest(requestId), [store]);
  const searchUsers = useCallback((query: string) => store.searchUsers(query), [store]);
  const clearSearch = useCallback(() => store.clearSearch(), [store]);
  const fetchChatHistory = useCallback((channel: ChatChannel) => store.fetchChatHistory(channel), [store]);
  const sendChat = useCallback((message: Omit<ChatMessage, "id" | "timestamp" | "read">) => store.sendChat(message), [store]);
  const markChannelRead = useCallback((channel: string) => store.markChannelRead(channel), [store]);
  const fetchMyGuild = useCallback(() => store.fetchMyGuild(), [store]);
  const fetchGuilds = useCallback(() => store.fetchGuilds(), [store]);
  const createGuild = useCallback((data: { name: string; tag: string; description: string }) => store.createGuild(data), [store]);
  const joinGuild = useCallback((guildId: string) => store.joinGuild(guildId), [store]);
  const leaveGuild = useCallback(() => store.leaveGuild(), [store]);
  const fetchFeed = useCallback((page?: number) => store.fetchFeed(page), [store]);
  const likeFeedItem = useCallback((itemId: string) => store.likeFeedItem(itemId), [store]);
  const fetchLeaderboard = useCallback((filter?: LeaderboardFilter) => store.fetchLeaderboard(filter), [store]);

  return {
    ...snapshot,
    fetchFriends,
    fetchFriendRequests,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    searchUsers,
    clearSearch,
    fetchChatHistory,
    sendChat,
    markChannelRead,
    fetchMyGuild,
    fetchGuilds,
    createGuild,
    joinGuild,
    leaveGuild,
    fetchFeed,
    likeFeedItem,
    fetchLeaderboard,
  };
}
