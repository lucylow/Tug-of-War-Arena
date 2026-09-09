import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Share, StyleSheet, Text, TextInput, View } from "react-native";

import { WALLET_COLORS as C } from "@/components/wallet/palette";
import { useBlockchain } from "@/hooks/use-blockchain";
import { ICON_BUTTON_SIZE, MIN_TOUCH_TARGET } from "@/lib/mobile";
import { EMOTES, EmoteService } from "@/lib/multiplayer/EmoteService";
import { MatchmakingService } from "@/lib/multiplayer/MatchmakingService";
import { PartyService } from "@/lib/multiplayer/PartyService";
import { SpectatorService } from "@/lib/multiplayer/SpectatorService";
import { SyncManager } from "@/lib/multiplayer/SyncManager";
import { VoiceChatService } from "@/lib/multiplayer/VoiceChatService";
import type { MatchmakingQueue, Party, VoiceStatus } from "@/lib/multiplayer/types";

type QueueState = "idle" | "searching" | "found";

export function MultiplayerHub() {
  const { isConnected: walletConnected } = useBlockchain();
  const [queueState, setQueueState] = useState<QueueState>("idle");
  const [queue, setQueue] = useState<MatchmakingQueue | null>(null);
  const [waitSeconds, setWaitSeconds] = useState(0);
  const [party, setParty] = useState<Party | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [voice, setVoice] = useState<VoiceStatus>({ connected: false, muted: false, enabled: false, audioLevel: 0, roomId: null });
  const [roomId, setRoomId] = useState<string | null>(null);
  const [spectating, setSpectating] = useState(false);
  const [status, setStatus] = useState("Queue is idle · local room ready");

  useEffect(() => {
    const matchmaking = MatchmakingService.getInstance();
    const partyService = PartyService.getInstance();
    const voiceChat = VoiceChatService.getInstance();
    const sync = SyncManager.getInstance();
    const spectator = SpectatorService.getInstance();

    const onQueue = (next: unknown) => setQueue(next as MatchmakingQueue);
    const onFound = () => {
      setQueueState("found");
      setStatus("Match found · connecting");
    };
    const onRoom = (...args: unknown[]) => {
      const room = args[0] as { id?: string } | undefined;
      setQueueState("idle");
      setRoomId(room?.id ?? sync.getRoomId());
      setStatus(`Room ${room?.id ?? "ready"}`);
    };
    const onCancelled = () => {
      setQueueState("idle");
      setQueue(null);
      setStatus("Search cancelled");
    };
    const onParty = (next: unknown) => setParty((next as Party | null) ?? partyService.getParty());
    const onVoice = () => setVoice(voiceChat.getStatus());
    const onSpectator = () => setSpectating(spectator.isSpectatingNow());

    matchmaking.on("queue-update", onQueue);
    matchmaking.on("match-found", onFound);
    matchmaking.on("room-ready", onRoom);
    matchmaking.on("cancelled", onCancelled);
    partyService.on("party-created", onParty);
    partyService.on("party-joined", onParty);
    partyService.on("party-updated", onParty);
    partyService.on("party-disbanded", onParty);
    voiceChat.on("connected", onVoice);
    voiceChat.on("disconnected", onVoice);
    voiceChat.on("mute-toggle", onVoice);
    spectator.on("spectator-connected", onSpectator);
    spectator.on("spectator-disconnected", onSpectator);
    sync.on("connected", (id: unknown) => setRoomId(typeof id === "string" ? id : sync.getRoomId()));

    setParty(partyService.getParty());
    setVoice(voiceChat.getStatus());
    setRoomId(sync.getRoomId());

    return () => {
      matchmaking.off("queue-update", onQueue);
      matchmaking.off("match-found", onFound);
      matchmaking.off("room-ready", onRoom);
      matchmaking.off("cancelled", onCancelled);
      partyService.off("party-created", onParty);
      partyService.off("party-joined", onParty);
      partyService.off("party-updated", onParty);
      partyService.off("party-disbanded", onParty);
      voiceChat.off("connected", onVoice);
      voiceChat.off("disconnected", onVoice);
      voiceChat.off("mute-toggle", onVoice);
      spectator.off("spectator-connected", onSpectator);
      spectator.off("spectator-disconnected", onSpectator);
    };
  }, []);

  useEffect(() => {
    if (queueState !== "searching") return;
    const timer = setInterval(() => {
      setWaitSeconds(MatchmakingService.getInstance().getEstimatedWaitTime());
    }, 500);
    return () => clearInterval(timer);
  }, [queueState]);

  const startSearch = () => {
    setQueueState("searching");
    setStatus("Searching for a crew");
    void MatchmakingService.getInstance()
      .startMatchmaking({ mode: "casual", minPlayers: 2, maxPlayers: 8 })
      .catch((error: unknown) => {
        setQueueState("idle");
        setStatus(error instanceof Error ? error.message : "Matchmaking failed");
      });
  };

  const cancelSearch = () => {
    MatchmakingService.getInstance().cancelMatchmaking();
  };

  const createParty = () => {
    void PartyService.getInstance()
      .createParty("Friendzone Party")
      .then((next) => setStatus(`Party code ${next.inviteCode}`));
  };

  const joinParty = () => {
    void PartyService.getInstance()
      .joinParty(inviteCode)
      .then((next) => setStatus(`Joined ${next.name}`))
      .catch((error: unknown) => setStatus(error instanceof Error ? error.message : "Join failed"));
  };

  const toggleVoice = () => {
    const chat = VoiceChatService.getInstance();
    if (chat.getStatus().connected) {
      chat.disconnect();
      return;
    }
    void chat.connect(roomId ?? "lobby");
  };

  const toggleSpectate = () => {
    const spectator = SpectatorService.getInstance();
    if (spectator.isSpectatingNow()) {
      void spectator.stopSpectating();
      return;
    }
    const target = roomId ?? SyncManager.getInstance().getRoomId();
    if (!target) {
      setStatus("Connect to a room before spectating");
      return;
    }
    void spectator.spectateMatch(target);
  };

  return (
    <View style={styles.card} accessibilityLabel="Multiplayer hub">
      <Text style={styles.kicker}>LIVE MULTIPLAYER</Text>
      <Text style={styles.title}>Queue, party, voice</Text>
      <Text style={styles.body}>{status}</Text>
      <Text style={styles.meta}>{walletConnected ? "Wallet connected for on-chain lobby" : "Wallet optional · local rooms stay playable"}</Text>

      {queueState === "idle" ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Find a match"
          onPress={startSearch}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Text style={styles.actionText}>FIND MATCH</Text>
        </Pressable>
      ) : (
        <View style={styles.searching}>
          <ActivityIndicator color={C.gold} />
          <Text style={styles.meta}>
            {queueState === "found" ? "Connecting…" : `Searching · ~${waitSeconds}s`}
            {queue ? ` · ${queue.players.length} seats` : ""}
          </Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Cancel matchmaking" onPress={cancelSearch} style={styles.secondary}>
            <Text style={styles.secondaryText}>CANCEL</Text>
          </Pressable>
        </View>
      )}

      {party ? (
        <View style={styles.party}>
          <Text style={styles.partyName}>{party.name}</Text>
          <Text style={styles.meta}>Code {party.inviteCode} · {party.members.length}/{party.maxMembers}</Text>
          <View style={styles.row}>
            {party.members.map((member) => (
              <View key={member.id} style={styles.member}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.meta}>{member.isReady ? "Ready" : "Wait"}{member.isLeader ? " · Host" : ""}</Text>
              </View>
            ))}
          </View>
          <View style={styles.row}>
            <Pressable accessibilityRole="button" accessibilityLabel="Toggle ready" onPress={() => void PartyService.getInstance().toggleReady()} style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
              <Text style={styles.chipText}>READY</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Share party invite"
              onPress={() => {
                void PartyService.getInstance().shareInvite().then((message) => {
                  if (message) return Share.share({ message, title: "Invite to Tug of War Arena" });
                });
              }}
              style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
            >
              <Text style={styles.chipText}>SHARE</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Leave party" onPress={() => void PartyService.getInstance().leaveParty()} style={({ pressed }) => [styles.chip, styles.danger, pressed && styles.pressed]}>
              <Text style={styles.chipText}>LEAVE</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View>
          <Pressable accessibilityRole="button" accessibilityLabel="Create a party" onPress={createParty} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
            <Text style={styles.secondaryText}>CREATE PARTY</Text>
          </Pressable>
          <View style={styles.joinRow}>
            <TextInput
              accessibilityLabel="Party invite code"
              autoCapitalize="characters"
              placeholder="INVITE"
              placeholderTextColor={C.fog}
              value={inviteCode}
              onChangeText={setInviteCode}
              style={styles.input}
            />
            <Pressable accessibilityRole="button" accessibilityLabel="Join party with invite code" onPress={joinParty} style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
              <Text style={styles.chipText}>JOIN</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={styles.emotes}>
        {EMOTES.slice(0, 6).map((emote) => (
          <Pressable
            key={emote.id}
            accessibilityRole="button"
            accessibilityLabel={`Send ${emote.name} emote`}
            onPress={() => EmoteService.getInstance().sendEmote(emote.id)}
            style={({ pressed }) => [styles.emote, pressed && styles.pressed]}
          >
            <Text style={styles.emoteIcon}>{emote.icon}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.row}>
        <Pressable accessibilityRole="button" accessibilityLabel={voice.connected ? "Disconnect voice chat" : "Connect voice chat"} onPress={toggleVoice} style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
          <Text style={styles.chipText}>{voice.connected ? "HANG UP" : "VOICE"}</Text>
        </Pressable>
        {voice.connected ? (
          <Pressable accessibilityRole="button" accessibilityLabel={voice.muted ? "Unmute microphone" : "Mute microphone"} onPress={() => VoiceChatService.getInstance().toggleMute()} style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
            <Text style={styles.chipText}>{voice.muted ? "MIC OFF" : "MIC ON"}</Text>
          </Pressable>
        ) : null}
        <Pressable accessibilityRole="button" accessibilityLabel={spectating ? "Stop spectating" : "Spectate current room"} onPress={toggleSpectate} style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
          <Text style={styles.chipText}>{spectating ? "LEAVE VIEW" : "SPECTATE"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
    backgroundColor: "#1A1F4A",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#4DE7F244",
  },
  kicker: { color: C.cyan, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  title: { color: C.cloud, fontSize: 16, fontWeight: "900", marginTop: 6 },
  body: { color: C.fog, fontSize: 12, lineHeight: 18, marginTop: 6 },
  meta: { color: C.fog, fontSize: 11, marginTop: 4 },
  action: {
    minHeight: MIN_TOUCH_TARGET,
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { color: C.ink, fontSize: 11, fontWeight: "900", letterSpacing: 0.8 },
  searching: { alignItems: "center", gap: 8, marginTop: 12 },
  secondary: { minHeight: 40, marginTop: 8, alignItems: "center", justifyContent: "center" },
  secondaryText: { color: C.fog, fontSize: 11, fontWeight: "800", letterSpacing: 0.7 },
  party: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
  partyName: { color: C.cloud, fontSize: 14, fontWeight: "800" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  member: { backgroundColor: C.panel, borderRadius: 12, padding: 8, minWidth: 72 },
  memberName: { color: C.cloud, fontSize: 11, fontWeight: "800" },
  chip: {
    minHeight: ICON_BUTTON_SIZE,
    minWidth: 72,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.cyan,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: { color: C.cyan, fontSize: 10, fontWeight: "900", letterSpacing: 0.6 },
  danger: { borderColor: C.coral },
  joinRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  input: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    color: C.cloud,
    paddingHorizontal: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  emotes: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  emote: {
    width: ICON_BUTTON_SIZE,
    height: ICON_BUTTON_SIZE,
    borderRadius: ICON_BUTTON_SIZE / 2,
    backgroundColor: C.panel,
    alignItems: "center",
    justifyContent: "center",
  },
  emoteIcon: { fontSize: 20 },
  pressed: { opacity: 0.78 },
});
