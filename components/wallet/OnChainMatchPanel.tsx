import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { WALLET_COLORS as C } from "@/components/wallet/palette";
import { TransactionStatus } from "@/components/wallet/TransactionStatus";
import { useGameContract } from "@/hooks/use-game-contract";
import { formatMatchStatus, formatMatchTeam } from "@/lib/web3/match";
import type { ArenaMatchView, WalletTxStatus } from "@/lib/web3/types";

export function OnChainMatchPanel() {
  const { createMatch, getMatch, getMatchCounter, loading, error, isLive, contractAddress } = useGameContract();
  const [status, setStatus] = useState<WalletTxStatus>("idle");
  const [hash, setHash] = useState<string | null>(null);
  const [match, setMatch] = useState<ArenaMatchView | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isLive) {
    return (
      <View style={styles.card}>
        <Text style={styles.kicker}>ON-CHAIN MATCH</Text>
        <Text style={styles.title}>MetaMask required</Text>
        <Text style={styles.body}>Connect MetaMask to create or inspect a live arena match. Offline play stays available.</Text>
      </View>
    );
  }

  if (!contractAddress) {
    return (
      <View style={styles.card}>
        <Text style={styles.kicker}>ON-CHAIN MATCH</Text>
        <Text style={styles.title}>Contract not configured</Text>
        <Text style={styles.body}>Set EXPO_PUBLIC_GAME_CONTRACT to enable live create/join transactions.</Text>
      </View>
    );
  }

  const handleCreate = async () => {
    setLocalError(null);
    setStatus("pending");
    try {
      const receipt = (await createMatch("CrewLead")) as { hash?: string };
      setHash(receipt?.hash ?? null);
      setStatus("success");
      const nextId = Number(await getMatchCounter()) - 1;
      if (Number.isFinite(nextId) && nextId > 0) {
        setMatch(await getMatch(nextId));
      }
    } catch (err) {
      setStatus("error");
      setLocalError(err instanceof Error ? err.message : "Failed to create match");
    }
  };

  const handleLookup = async () => {
    setLocalError(null);
    try {
      const nextId = Number(await getMatchCounter()) - 1;
      if (!Number.isFinite(nextId) || nextId < 1) {
        setLocalError("No matches found on this contract yet.");
        return;
      }
      setMatch(await getMatch(nextId));
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Failed to load match");
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>ON-CHAIN MATCH</Text>
      <Text style={styles.title}>TugOfWarArena</Text>
      <Text style={styles.body}>Creates a FZONE-staked lobby on the connected network. Gameplay itself stays off-chain.</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ busy: loading, disabled: loading }}
        disabled={loading}
        onPress={() => {
          void handleCreate();
        }}
        style={({ pressed }) => [styles.action, loading && styles.disabled, pressed && styles.pressed]}
      >
        {loading && <ActivityIndicator size="small" color={C.gold} />}
        <Text style={styles.actionText}>{loading ? "SUBMITTING..." : "CREATE MATCH"}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        disabled={loading}
        onPress={() => {
          void handleLookup();
        }}
        style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
      >
        <Text style={styles.secondaryText}>LOAD LATEST MATCH</Text>
      </Pressable>
      <TransactionStatus status={status} hash={hash} error={localError ?? error} />
      {match && (
        <View style={styles.match}>
          <Text style={styles.matchTitle}>Match #{match.id}</Text>
          <Text style={styles.meta}>Players: {match.players.length}</Text>
          <Text style={styles.meta}>Status: {formatMatchStatus(match.status)}</Text>
          <Text style={styles.meta}>Winner: {formatMatchTeam(match.winner)}</Text>
          <Text style={styles.meta}>Prize: {match.prizePool} FZONE</Text>
          <Text style={styles.meta}>Sun {match.sunPower} · Moon {match.moonPower}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 14,
    backgroundColor: "#1A1F4A",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FFC85744",
    shadowColor: "#FFC857",
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
  kicker: { color: C.gold, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  title: { color: C.cloud, fontSize: 16, fontWeight: "900", marginTop: 6 },
  body: { color: C.fog, fontSize: 12, lineHeight: 18, marginTop: 6 },
  action: {
    minHeight: 44,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  actionText: { color: C.gold, fontSize: 11, fontWeight: "900", letterSpacing: 0.8 },
  secondary: { minHeight: 40, marginTop: 8, alignItems: "center", justifyContent: "center" },
  secondaryText: { color: C.fog, fontSize: 11, fontWeight: "800", letterSpacing: 0.7 },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.78 },
  match: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
  matchTitle: { color: C.cloud, fontSize: 14, fontWeight: "800" },
  meta: { color: C.fog, fontSize: 11, marginTop: 4 },
});
