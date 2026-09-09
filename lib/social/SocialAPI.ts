import { getSocialService, type SocialService } from "./SocialService";
import { errorMessage } from "./time";
import type { ChatChannel, ChatMessage, LeaderboardFilter } from "./types";

/**
 * Local-first social API. The companion demo stays playable offline; the same
 * methods are exposed on the tRPC / REST layer when a backend is running.
 */
function fromService<T>(run: (service: SocialService) => T | Promise<T>): Promise<T> {
  try {
    return Promise.resolve(run(getSocialService())).catch((error) => {
      throw error instanceof Error ? error : new Error(errorMessage(error, "Social request failed"));
    });
  } catch (error) {
    return Promise.reject(error instanceof Error ? error : new Error(errorMessage(error, "Social request failed")));
  }
}

export const SocialAPI = {
  getFriends: () => fromService((service) => service.getFriends()),
  getFriendRequests: () => fromService((service) => service.getFriendRequests()),
  sendFriendRequest: (userId: string) => fromService((service) => service.sendFriendRequest(userId)),
  acceptFriendRequest: (requestId: string) => fromService((service) => service.acceptFriendRequest(requestId)),
  rejectFriendRequest: (requestId: string) => fromService((service) => service.rejectFriendRequest(requestId)),
  searchUsers: (query: string) => fromService((service) => service.searchUsers(query)),
  getChatHistory: (channel: ChatChannel) => fromService((service) => service.getChatHistory(channel)),
  sendMessage: (message: Omit<ChatMessage, "id" | "timestamp" | "read">) =>
    fromService((service) => service.sendMessage(message)),
  getMyGuild: () => fromService((service) => service.getMyGuild()),
  getGuilds: () => fromService((service) => service.getGuilds()),
  createGuild: (data: { name: string; tag: string; description: string }) =>
    fromService((service) => service.createGuild(data)),
  joinGuild: (guildId: string) => fromService((service) => service.joinGuild(guildId)),
  leaveGuild: () => fromService((service) => service.leaveGuild()),
  getFeed: (page = 1) => fromService((service) => service.getFeed(page)),
  likeFeedItem: (itemId: string) => fromService((service) => service.likeFeedItem(itemId)),
  getLeaderboard: (filter: LeaderboardFilter = "global") =>
    fromService((service) => service.getLeaderboard(filter)),
};
