import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { WALLET_COLORS as C } from "@/components/wallet/palette";
import { TransactionStatus } from "@/components/wallet/TransactionStatus";
import { useGameContract } from "@/hooks/use-game-contract";
import { useToken } from "@/hooks/use-token";
import { MOCK_FALLBACK_COPY } from "@/lib/mock/fallback";
import { FZONE_ENTRY_FEE_LABEL } from "@/lib/web3/addresses";
import { getExplorerTxUrl } from "@/lib/web3/config";
import { formatBalance } from "@/lib/web3/format";
import { formatContractError } from "@/lib/web3/errors";
import { formatMatchStatus, formatMatchTeam } from "@/lib/web3/match";
import type { ArenaMatchView, ArenaTxResult, WalletTxStatus } from "@/lib/web3/types";
import { useBlockchain } from "@/hooks/use-blockchain";

export function OnChainMatchPanel() {
  const { chainId, isLiveWallet } = useBlockchain();
  const { createMatch, joinMatch, getMatch, getMatchCounter, loading, error, isLive, usingFallback, phase, contractAddress } =
    useGameContract();
  const { balance: tokenBalance, needsApproval, error: tokenError } = useToken();
  const [status, setStatus] = useState<WalletTxStatus>("idle");
  const [hash, setHash] = useState<string | null>(null);
  const [match, setMatch] = useState<ArenaMatchView | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const demo = !isLive || usingFallback || !isLiveWallet;

  const applyResult = async (receipt: ArenaTxResult) => {
    setHash(receipt.hash ?? null);
    try {
      if (receipt.view) {
        setMatch(receipt.view);
        setStatus("success");
        return;
      }
      const matchId = Number(receipt.matchId);
      if (Number.isFinite(matchId) && matchId > 0) {
        setMatch(await getMatch(matchId));
        setStatus("success");
        return;
      }
      const nextId = Number(await getMatchCounter()) - 1;
      if (Number.isFinite(nextId) && nextId >= 0) {
        setMatch(await getMatch(nextId));
      }
      setStatus("success");
    } catch (err) {
      setStatus("success");
      setLocalError(formatContractError(err) || "Match submitted, but the latest lobby could not be loaded.");
    }
  };

  const handleCreate = async () => {
    setLocalError(null);
    setStatus("pending");
    try {
      await applyResult(await createMatch("CrewLead"));
    } catch (err) {
      setStatus("error");
      setLocalError(formatContractError(err));
    }
  };

  const handleJoin = async () => {
    setLocalError(null);
    setStatus("pending");
    try {
      const nextId = Number(await getMatchCounter()) - 1;
      if (!Number.isFinite(nextId) || nextId < 0) {
        setStatus("error");
        setLocalError("No matches found yet. Create a lobby first.");
        return;
      }
      await applyResult(await joinMatch(nextId, "Crewmate"));
    } catch (err) {
      setStatus("error");
      setLocalError(formatContractError(err));
    }
  };

  const handleLookup = async () => {
    setLocalError(null);
    try {
      const nextId = Number(await getMatchCounter()) - 1;
      if (!Number.isFinite(nextId) || nextId < 0) {
        setLocalError("No matches found yet. Create a local lobby to seed one.");
        return;
      }
      setMatch(await getMatch(nextId));
    } catch (err) {
      setLocalError(formatContractError(err));
    }
  };

  const phaseLabel =
    phase === "approving" ? "Approve FZONE spending in MetaMask" : phase === "submitting" ? "Confirm match transaction in MetaMask" : null;

  return (
    <View style={styles.card} accessibilityLabel={demo ? "Demo match panel" : "On-chain match panel"}>
      <View style={styles.header}>
        <Text style={styles.kicker}>{demo ? MOCK_FALLBACK_COPY.kicker : "ON-CHAIN MATCH"}</Text>
        {demo ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{MOCK_FALLBACK_COPY.badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.title}>{demo ? "Local arena lobby" : "TugOfWarArena"}</Text>
      <Text style={styles.body}>
        {demo
          ? MOCK_FALLBACK_COPY.matchHint
          : `Creates a ${FZONE_ENTRY_FEE_LABEL}-staked lobby on the connected network. Gameplay itself stays off-chain.`}
      </Text>
      {!demo ? (
        <Text style={styles.meta}>
          {formatBalance(tokenBalance, 2)} FZONE available
          {needsApproval ? ` · approval needed for ${FZONE_ENTRY_FEE_LABEL}` : ` · ${FZONE_ENTRY_FEE_LABEL} approved`}
        </Text>
      ) : null}
      {isLiveWallet && !contractAddress ? (
        <Text style={styles.warn}>Arena contracts are not deployed on this network yet. Switch to Polygon Amoy or set EXPO_PUBLIC_GAME_CONTRACT.</Text>
      ) : null}
      {!demo && tokenError ? <Text style={styles.warn}>{tokenError}</Text> : null}
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
        <Text style={styles.actionText}>
          {phase === "approving" ? "APPROVING FZONE..." : loading ? "SUBMITTING..." : demo ? "CREATE DEMO MATCH" : needsApproval ? "APPROVE & CREATE MATCH" : "CREATE MATCH"}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        disabled={loading}
        onPress={() => {
          void handleJoin();
        }}
        style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
      >
        <Text style={styles.secondaryText}>{demo ? "JOIN LATEST DEMO MATCH" : "JOIN LATEST MATCH"}</Text>
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
      <TransactionStatus
        status={status}
        hash={hash}
        error={localError ?? error ?? tokenError}
        explorerUrl={getExplorerTxUrl(chainId, hash)}
        phaseLabel={phaseLabel}
      />
      {match && (
        <View style={styles.match}>
          <Text style={styles.matchTitle}>Match #{match.id}</Text>
          <Text style={styles.meta}>Players: {match.players.length}</Text>
          <Text style={styles.meta}>Status: {formatMatchStatus(match.status)}</Text>
          <Text style={styles.meta}>Winner: {formatMatchTeam(match.winner)}</Text>
          <Text style={styles.meta}>Prize: {match.prizePool} FZONE</Text>
          <Text style={styles.meta}>
            Sun {match.sunPower} · Moon {match.moonPower}
          </Text>
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  kicker: { color: C.gold, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#72F2B622",
  },
  badgeText: { color: C.gold, fontSize: 9, fontWeight: "800", letterSpacing: 0.6 },
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
  warn: { color: C.coral, fontSize: 11, marginTop: 8, fontWeight: "700", lineHeight: 16 },
});
