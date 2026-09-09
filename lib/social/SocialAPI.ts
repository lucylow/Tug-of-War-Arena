import { getSocialService } from "./SocialService";
import type {
  ChatChannel,
  ChatMessage,
  FeedPage,
  FriendRequest,
  LeaderboardFilter,
  SocialFriend,
  SocialGuild,
  SocialLeaderboardEntry,
} from "./types";

/**
 * Local-first social API. The companion demo stays playable offline; the same
 * methods are exposed on the tRPC / REST layer when a backend is running.
 */
export const SocialAPI = {
  getFriends(): Promise<SocialFriend[]> {
    return Promise.resolve(getSocialService().getFriends());
  },
  getFriendRequests(): Promise<FriendRequest[]> {
    return Promise.resolve(getSocialService().getFriendRequests());
  },
  sendFriendRequest(userId: string): Promise<FriendRequest> {
    return Promise.resolve(getSocialService().sendFriendRequest(userId));
  },
  acceptFriendRequest(requestId: string): Promise<SocialFriend> {
    return Promise.resolve(getSocialService().acceptFriendRequest(requestId));
  },
  rejectFriendRequest(requestId: string): Promise<string> {
    return Promise.resolve(getSocialService().rejectFriendRequest(requestId));
  },
  searchUsers(query: string): Promise<SocialFriend[]> {
    return Promise.resolve(getSocialService().searchUsers(query));
  },
  getChatHistory(channel: ChatChannel): Promise<ChatMessage[]> {
    return Promise.resolve(getSocialService().getChatHistory(channel));
  },
  sendMessage(message: Omit<ChatMessage, "id" | "timestamp" | "read">): Promise<ChatMessage> {
    return Promise.resolve(getSocialService().sendMessage(message));
  },
  getMyGuild(): Promise<SocialGuild | null> {
    return Promise.resolve(getSocialService().getMyGuild());
  },
  getGuilds(): Promise<SocialGuild[]> {
    return Promise.resolve(getSocialService().getGuilds());
  },
  createGuild(data: { name: string; tag: string; description: string }): Promise<SocialGuild> {
    return Promise.resolve(getSocialService().createGuild(data));
  },
  joinGuild(guildId: string): Promise<SocialGuild> {
    return Promise.resolve(getSocialService().joinGuild(guildId));
  },
  leaveGuild(): Promise<null> {
    return Promise.resolve(getSocialService().leaveGuild());
  },
  getFeed(page = 1): Promise<FeedPage> {
    return Promise.resolve(getSocialService().getFeed(page));
  },
  likeFeedItem(itemId: string): Promise<string> {
    return Promise.resolve(getSocialService().likeFeedItem(itemId));
  },
  getLeaderboard(filter: LeaderboardFilter = "global"): Promise<SocialLeaderboardEntry[]> {
    return Promise.resolve(getSocialService().getLeaderboard(filter));
  },
};
