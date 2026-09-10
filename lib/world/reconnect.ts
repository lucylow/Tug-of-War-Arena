import { getAchievementOutbox } from "./outbox";
import { getWorldSession, refreshWorldSession, markWorldSessionOffline } from "./worldSession";

export type ReconnectStep = "detect" | "load_cache" | "request_feed" | "reconcile" | "update_ui" | "clear_outbox";

export function reconnectFlow(online: boolean): ReconnectStep[] {
  if (!online) {
    markWorldSessionOffline();
    return ["detect"];
  }
  const session = getWorldSession();
  if (session.sessionId) refreshWorldSession("ready");
  getAchievementOutbox().visualState(true);
  return ["detect", "load_cache", "request_feed", "reconcile", "update_ui", "clear_outbox"];
}
