import { resetMultiplayerClock } from "@/lib/multiplayer/clock";
import { resetPlayerIdentity } from "@/lib/multiplayer/identity";
import { EmoteService } from "@/lib/multiplayer/EmoteService";
import { LeaderboardService } from "@/lib/multiplayer/LeaderboardService";
import { MatchmakingService } from "@/lib/multiplayer/MatchmakingService";
import { PartyService, resetPartyRegistry } from "@/lib/multiplayer/PartyService";
import { RematchService } from "@/lib/multiplayer/RematchService";
import { SpectatorService } from "@/lib/multiplayer/SpectatorService";
import { SyncManager } from "@/lib/multiplayer/SyncManager";
import { clearMultiplayerStorage, resetMultiplayerStorageDriver } from "@/lib/multiplayer/storage";
import { setGameTransport } from "@/lib/multiplayer/transport";
import { VoiceChatService } from "@/lib/multiplayer/VoiceChatService";

export { MultiplayerEmitter } from "@/lib/multiplayer/emitter";
export { getClock, setMultiplayerClock, resetMultiplayerClock } from "@/lib/multiplayer/clock";
export { getPlayerId, getPlayerName, setPlayerIdentity, resetPlayerIdentity } from "@/lib/multiplayer/identity";
export { reconnectDelay, MAX_RECONNECT_ATTEMPTS } from "@/lib/multiplayer/reconnect";
export { SyncManager } from "@/lib/multiplayer/SyncManager";
export { MatchmakingService } from "@/lib/multiplayer/MatchmakingService";
export { PartyService } from "@/lib/multiplayer/PartyService";
export { SpectatorService } from "@/lib/multiplayer/SpectatorService";
export { RematchService, recordFinishedMatch } from "@/lib/multiplayer/RematchService";
export { VoiceChatService } from "@/lib/multiplayer/VoiceChatService";
export { EmoteService, EMOTES, EMOTE_COOLDOWN_MS } from "@/lib/multiplayer/EmoteService";
export { LeaderboardService } from "@/lib/multiplayer/LeaderboardService";
export { matchStateToRemotePacket, reportLocalPull } from "@/lib/multiplayer/scene-bridge";
export { createGameTransport, LocalGameTransport, setGameTransport } from "@/lib/multiplayer/transport";
export { clearMultiplayerStorage, setMultiplayerStorageDriver, MULTIPLAYER_STORAGE_KEYS } from "@/lib/multiplayer/storage";
export type {
  ArenaAction,
  ChatChannel,
  Emote,
  LeaderboardEntry,
  MatchRecord,
  MatchState,
  MatchmakingOptions,
  MatchmakingQueue,
  Party,
  PartyMember,
  PlayerState,
  SpectatorInfo,
  VoiceStatus,
} from "@/lib/multiplayer/types";

export async function resetMultiplayer(): Promise<void> {
  SpectatorService.resetInstance();
  MatchmakingService.resetInstance();
  PartyService.resetInstance();
  RematchService.resetInstance();
  EmoteService.resetInstance();
  LeaderboardService.resetInstance();
  VoiceChatService.resetInstance();
  SyncManager.resetInstance();
  resetPartyRegistry();
  setGameTransport(null);
  resetPlayerIdentity();
  resetMultiplayerClock();
  await clearMultiplayerStorage();
  resetMultiplayerStorageDriver();
}
