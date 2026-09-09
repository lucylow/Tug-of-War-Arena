import { Link } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { WALLET_COLORS as C } from "@/components/wallet/palette";
import { useBlockchain } from "@/hooks/use-blockchain";
import type { LeaderboardEntry, MockNFT, MockUser } from "@/lib/mock/generators";

export function DemoWorldPanel() {
  const { isMock, getCurrentUser, getNFTs, getMatches, getLeaderboard, mintNFT, createMatch } = useBlockchain();
  const [user, setUser] = useState<MockUser | null>(null);
  const [nftCount, setNftCount] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [ranks, setRanks] = useState<LeaderboardEntry[]>([]);
  const [status, setStatus] = useState("Mock world idle");

  const loadData = useCallback(async () => {
    if (!isMock) {
      setUser(null);
      setNftCount(0);
      setMatchCount(0);
      setRanks([]);
      return;
    }
    const [nextUser, nfts, matches, board] = await Promise.all([
      getCurrentUser(),
      getNFTs(),
      getMatches(),
      getLeaderboard(),
    ]);
    setUser(nextUser);
    setNftCount(nfts.length);
    setMatchCount(matches.length);
    setRanks(board.slice(0, 3));
    setStatus("Seeded mock world loaded");
  }, [getCurrentUser, getLeaderboard, getMatches, getNFTs, isMock]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (!isMock) {
    return (
      <View style={styles.card}>
        <Text style={styles.kicker}>MOCK CHAIN</Text>
        <Text style={styles.title}>Demo world off</Text>
        <Text style={styles.body}>Enable Demo Mode to generate users, NFTs, matches, quests, and factions without a live wallet.</Text>
        <Link href="/dev/animation-lab" asChild>
          <Pressable accessibilityRole="button" accessibilityLabel="Open animation lab" style={({ pressed }) => [styles.action, { marginTop: 12, alignSelf: "flex-start" }, pressed && styles.pressed]}>
            <Text style={styles.actionText}>ANIMATION LAB</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  const handleMint = async () => {
    const nft: MockNFT | null = await mintNFT("Rare");
    setStatus(nft ? `Minted ${nft.rarity} #${nft.id}` : "Mint failed");
    const nfts = await getNFTs();
    setNftCount(nfts.length);
  };

  const handleMatch = async () => {
    const match = await createMatch([user?.id ?? "user_0"]);
    setStatus(match ? `Created ${match.id}` : "Match create failed");
    const matches = await getMatches();
    setMatchCount(matches.length);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>MOCK CHAIN</Text>
      <Text style={styles.title}>{user?.displayName ?? "Demo captain"}</Text>
      <Text style={styles.body}>
        {nftCount} NFTs · {matchCount} matches · {user ? `Lv ${user.level}` : "seed 42"} · {user?.reputation ?? 0} rep
      </Text>
      {ranks.map((entry) => (
        <Text key={entry.userId} style={styles.rank}>
          #{entry.rank} {entry.displayName} · {entry.wins} wins
        </Text>
      ))}
      <Text style={styles.status}>{status}</Text>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={() => void handleMint()} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
          <Text style={styles.actionText}>MINT NFT</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => void handleMatch()} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
          <Text style={styles.actionText}>CREATE MATCH</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => void loadData()} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
          <Text style={styles.actionText}>REFRESH</Text>
        </Pressable>
        <Link href="/dev/animation-lab" asChild>
          <Pressable accessibilityRole="button" accessibilityLabel="Open animation lab" style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
            <Text style={styles.actionText}>ANIMATION LAB</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 8,
    marginBottom: 10,
    backgroundColor: "#1A1F4A",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#72F2B644",
  },
  kicker: { color: C.mint, fontSize: 10, fontWeight: "900", letterSpacing: 1.3 },
  title: { color: C.cloud, fontSize: 16, fontWeight: "900", marginTop: 4 },
  body: { color: C.fog, fontSize: 12, marginTop: 6, fontWeight: "700" },
  rank: { color: C.cloud, fontSize: 11, marginTop: 4, fontWeight: "700" },
  status: { color: C.gold, fontSize: 11, marginTop: 8, fontWeight: "800" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  action: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.mint,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  actionText: { color: C.mint, fontSize: 10, fontWeight: "900", letterSpacing: 0.6 },
  pressed: { opacity: 0.75 },
});
