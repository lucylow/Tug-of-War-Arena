import type { Express, Request, Response } from "express";

import { getSocialService } from "../lib/social/SocialService";
import type { ChatChannel, LeaderboardFilter } from "../lib/social/types";

function handle(res: Response, run: () => unknown): void {
  try {
    res.json(run());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Social request failed";
    const status = message.includes("not found") ? 404 : 400;
    res.status(status).json({ error: message });
  }
}

export function registerSocialRoutes(app: Express): void {
  app.get("/api/social/friends", (_req, res) => handle(res, () => getSocialService().getFriends()));
  app.get("/api/social/friends/requests", (_req, res) => handle(res, () => getSocialService().getFriendRequests()));
  app.post("/api/social/friends/request", (req: Request, res: Response) =>
    handle(res, () => getSocialService().sendFriendRequest(String(req.body?.targetUserId ?? req.body?.userId ?? ""))),
  );
  app.put("/api/social/friends/accept/:requestId", (req, res) =>
    handle(res, () => getSocialService().acceptFriendRequest(String(req.params.requestId))),
  );
  app.post("/api/social/friends/reject/:requestId", (req, res) =>
    handle(res, () => getSocialService().rejectFriendRequest(String(req.params.requestId))),
  );
  app.get("/api/social/users/search", (req, res) =>
    handle(res, () => getSocialService().searchUsers(String(req.query.q ?? ""))),
  );

  app.get("/api/social/chat/:channel", (req, res) =>
    handle(res, () => getSocialService().getChatHistory(String(req.params.channel) as ChatChannel)),
  );
  app.post("/api/social/chat", (req, res) => handle(res, () => getSocialService().sendMessage(req.body)));

  app.get("/api/social/guilds", (_req, res) => handle(res, () => getSocialService().getGuilds()));
  app.get("/api/social/guilds/my", (_req, res) => handle(res, () => getSocialService().getMyGuild()));
  app.post("/api/social/guilds", (req, res) => handle(res, () => getSocialService().createGuild(req.body)));
  app.post("/api/social/guilds/:guildId/join", (req, res) =>
    handle(res, () => getSocialService().joinGuild(String(req.params.guildId))),
  );
  app.delete("/api/social/guilds/leave", (_req, res) => handle(res, () => getSocialService().leaveGuild()));

  app.get("/api/social/feed", (req, res) =>
    handle(res, () => getSocialService().getFeed(Number.parseInt(String(req.query.page ?? "1"), 10) || 1)),
  );
  app.post("/api/social/feed/:itemId/like", (req, res) =>
    handle(res, () => ({ success: true, id: getSocialService().likeFeedItem(String(req.params.itemId)) })),
  );

  app.get("/api/social/leaderboard", (req, res) =>
    handle(res, () => getSocialService().getLeaderboard(String(req.query.filter ?? "global") as LeaderboardFilter)),
  );
}
