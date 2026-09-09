import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { packetFromSyncedMatch } from "../scene/src/logic/remote";
import {
  EmoteService,
  LeaderboardService,
  MatchmakingService,
  PartyService,
  RematchService,
  SpectatorService,
  SyncManager,
  VoiceChatService,
  matchStateToRemotePacket,
  reconnectDelay,
  recordFinishedMatch,
  resetMultiplayer,
  setMultiplayerStorageDriver,
  setPlayerIdentity,
} from "../lib/multiplayer";
import { decodePlayerInMatch, decodePlayerStats } from "../lib/web3/match";
import { TUG_OF_WAR_ARENA_ABI } from "../lib/web3/abi";

function memoryStorage() {
  const mem = new Map<string, string>();
  setMultiplayerStorageDriver({
    getItem: async (key) => mem.get(key) ?? null,
    setItem: async (key, value) => {
      mem.set(key, value);
    },
    removeItem: async (key) => {
      mem.delete(key);
    },
  });
}

beforeEach(async () => {
  memoryStorage();
  setPlayerIdentity("player_test", "Tester");
});

afterEach(async () => {
  await resetMultiplayer();
});

describe("reconnect backoff", () => {
  it("doubles until the 30s cap", () => {
    expect(reconnectDelay(0)).toBe(1000);
    expect(reconnectDelay(1)).toBe(2000);
    expect(reconnectDelay(5)).toBe(30_000);
    expect(reconnectDelay(8)).toBe(30_000);
  });
});

describe("SyncManager", () => {
  it("connects to a local room and reports connection", async () => {
    const sync = SyncManager.getInstance();
    const room = await sync.connectToMatch();
    expect(room.id).toBeTruthy();
    expect(sync.isConnected()).toBe(true);
    expect(sync.getState()?.matchStatus).toBe("waiting");
  });

  it("applies tap power after ready and countdown", async () => {
    vi.useFakeTimers();
    try {
      const sync = SyncManager.getInstance();
      await sync.connectToMatch();
      sync.setReady(true);
      await vi.advanceTimersByTimeAsync(350);
      sync.sendAction("tap", { amount: 2.3 });
      expect(sync.getState()?.ropePosition).toBeCloseTo(2.3);
      expect(sync.getState()?.teamPower[0]).toBeCloseTo(2.3);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("MatchmakingService", () => {
  it("finds a casual match and opens a room", async () => {
    const service = MatchmakingService.getInstance();
    const ready = new Promise((resolve) => service.on("room-ready", resolve));
    await service.startMatchmaking({ mode: "casual", minPlayers: 2 });
    await ready;
    expect(SyncManager.getInstance().isConnected()).toBe(true);
    expect(service.getQueueStatus()).toBeNull();
  });
});

describe("PartyService", () => {
  it("creates a party, toggles ready, and disbands on leave", async () => {
    const service = PartyService.getInstance();
    const party = await service.createParty("Crew Party");
    expect(party.inviteCode).toHaveLength(6);
    expect(party.members).toHaveLength(1);
    await service.toggleReady();
    expect(service.isReady()).toBe(true);
    await service.leaveParty();
    expect(service.getParty()).toBeNull();
  });

  it("rejects short invite codes", async () => {
    await expect(PartyService.getInstance().joinParty("AB")).rejects.toThrow("Invalid invite code");
  });
});

describe("Spectator, rematch, voice, emotes, leaderboard", () => {
  it("spectates a live room", async () => {
    const sync = SyncManager.getInstance();
    const room = await sync.connectToMatch();
    const spectator = SpectatorService.getInstance();
    await spectator.spectateMatch(room.id);
    expect(spectator.isSpectatingNow()).toBe(true);
    expect(spectator.getSpectatorInfo()?.roomId).toBe(room.id);
    await spectator.stopSpectating();
    expect(spectator.isSpectatingNow()).toBe(false);
  });

  it("records a match, votes rematch, and replays history", async () => {
    const rematch = RematchService.getInstance();
    const record = await recordFinishedMatch({
      won: true,
      team: "sun",
      taps: 12,
      duration: 28,
      rope: 44,
    });
    expect((await rematch.getMatchHistory())[0]?.id).toBe(record.id);
    const ready = new Promise((resolve) => rematch.on("rematch-ready", resolve));
    await rematch.requestRematch(record.id);
    await rematch.castRematchVote(record.id, "player_other");
    await ready;
    expect(rematch.rematchVoteCount()).toBe(2);
    const replayed = new Promise((resolve) => rematch.on("replay-start", resolve));
    await rematch.replayMatch(record.id);
    await replayed;
  });

  it("toggles voice mute and emits audio while connected", async () => {
    const voice = VoiceChatService.getInstance();
    await voice.connect("room_1");
    expect(voice.getStatus().connected).toBe(true);
    expect(voice.toggleMute()).toBe(true);
    expect(voice.getStatus().muted).toBe(true);
    voice.disconnect();
    expect(voice.getStatus().connected).toBe(false);
  });

  it("enforces emote cooldown and stores favorites", async () => {
    const emotes = EmoteService.getInstance();
    expect(emotes.sendEmote("wave")?.icon).toBe("👋");
    expect(emotes.sendEmote("wave")).toBeNull();
    await emotes.toggleFavorite("wave");
    expect((await emotes.getFavorites()).map((emote) => emote.id)).toEqual(["wave"]);
  });

  it("updates ranked stats and friend filters", async () => {
    const board = LeaderboardService.getInstance();
    const entry = await board.updatePlayerStats("player_test", true, 40);
    expect(entry.wins).toBe(1);
    expect(entry.elo).toBe(1220);
    await board.addFriend("player_test");
    const friends = await board.fetchLeaderboard({ type: "friends" });
    expect(friends.some((item) => item.playerId === "player_test")).toBe(true);
  });
});

describe("scene and contract bridges", () => {
  it("maps match state onto the plaza remote packet", () => {
    const packet = matchStateToRemotePacket({
      roomId: "room_1",
      players: {},
      teamPower: [12, 8],
      ropePosition: 6,
      matchTime: 21,
      matchStatus: "playing",
      round: 1,
      scores: [1, 0],
      mvp: "",
      startTime: 1,
      endTime: 0,
      version: 3,
      viewers: 2,
    });
    expect(packet).toMatchObject({ pull: 6, sunPower: 12, moonPower: 8, phase: "live", timeRemaining: 21 });
    expect(packetFromSyncedMatch({
      ropePosition: 6,
      teamPower: [12, 8],
      matchTime: 21,
      scores: [1, 0],
      matchStatus: "playing",
    }).phase).toBe("live");
  });

  it("decodes on-chain player views for multiplayer settlement", () => {
    const player = decodePlayerInMatch(["0xabc", "CrewLead", 0, 18n, true]);
    expect(player.displayName).toBe("CrewLead");
    expect(player.isReady).toBe(true);
    expect(decodePlayerStats(1210n, player).elo).toBe("1210");
    expect(TUG_OF_WAR_ARENA_ABI.some((item) => item.includes("updatePower"))).toBe(true);
    expect(TUG_OF_WAR_ARENA_ABI.some((item) => item.includes("nextMatchId"))).toBe(true);
    expect(() => decodePlayerInMatch({})).toThrow("Invalid player payload");
  });
});
