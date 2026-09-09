import { z } from "zod";

import { SocialService, getSocialService } from "../lib/social/SocialService";
import { publicProcedure, router } from "./_core/trpc";

const chatChannelSchema = z.enum(["direct", "party", "global"]);
const leaderboardFilterSchema = z.enum(["global", "friends", "guild"]);

function service(): SocialService {
  return getSocialService();
}

export const socialRouter = router({
  friends: publicProcedure.query(() => service().getFriends()),
  friendRequests: publicProcedure.query(() => service().getFriendRequests()),
  sendFriendRequest: publicProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .mutation(({ input }) => service().sendFriendRequest(input.userId)),
  acceptFriendRequest: publicProcedure
    .input(z.object({ requestId: z.string().min(1) }))
    .mutation(({ input }) => service().acceptFriendRequest(input.requestId)),
  rejectFriendRequest: publicProcedure
    .input(z.object({ requestId: z.string().min(1) }))
    .mutation(({ input }) => service().rejectFriendRequest(input.requestId)),
  searchUsers: publicProcedure
    .input(z.object({ query: z.string().min(2) }))
    .query(({ input }) => service().searchUsers(input.query)),

  chatHistory: publicProcedure
    .input(z.object({ channel: chatChannelSchema }))
    .query(({ input }) => service().getChatHistory(input.channel)),
  sendMessage: publicProcedure
    .input(
      z.object({
        senderId: z.string().min(1),
        senderName: z.string().min(1),
        senderAvatar: z.string(),
        content: z.string().min(1).max(500),
        channel: chatChannelSchema,
        recipientId: z.string().optional(),
      }),
    )
    .mutation(({ input }) => service().sendMessage(input)),

  guilds: publicProcedure.query(() => service().getGuilds()),
  myGuild: publicProcedure.query(() => service().getMyGuild()),
  createGuild: publicProcedure
    .input(
      z.object({
        name: z.string().min(2).max(40),
        tag: z.string().min(2).max(5),
        description: z.string().max(240),
      }),
    )
    .mutation(({ input }) => service().createGuild(input)),
  joinGuild: publicProcedure
    .input(z.object({ guildId: z.string().min(1) }))
    .mutation(({ input }) => service().joinGuild(input.guildId)),
  leaveGuild: publicProcedure.mutation(() => service().leaveGuild()),

  feed: publicProcedure
    .input(z.object({ page: z.number().int().min(1).optional() }).optional())
    .query(({ input }) => service().getFeed(input?.page ?? 1)),
  likeFeedItem: publicProcedure
    .input(z.object({ itemId: z.string().min(1) }))
    .mutation(({ input }) => service().likeFeedItem(input.itemId)),

  leaderboard: publicProcedure
    .input(z.object({ filter: leaderboardFilterSchema.optional() }).optional())
    .query(({ input }) => service().getLeaderboard(input?.filter ?? "global")),
});
