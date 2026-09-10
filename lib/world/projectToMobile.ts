import { projectWorldFeedToMobile, worldFeedFromHybrid } from "./projection";
import type { HybridWorldDataset } from "@/lib/hybrid-world";
import type { WorldFeed } from "@/shared/friendzone-world-protocol";

export function projectPlayers(feed: WorldFeed) {
  return projectWorldFeedToMobile(feed).presence;
}

export function projectRooms(feed: WorldFeed) {
  return projectWorldFeedToMobile(feed).rooms;
}

export function projectEvents(feed: WorldFeed) {
  return projectWorldFeedToMobile(feed).events;
}

export function projectMissions(feed: WorldFeed) {
  return projectWorldFeedToMobile(feed).missions;
}

export function projectArena(feed: WorldFeed) {
  return feed.scoreboard;
}

export function projectGovernance(feed: WorldFeed) {
  return feed.governance;
}

export function projectDataset(dataset: HybridWorldDataset) {
  return projectWorldFeedToMobile(worldFeedFromHybrid(dataset));
}
