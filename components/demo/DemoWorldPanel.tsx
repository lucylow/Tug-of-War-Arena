import { Link } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { WALLET_COLORS as C } from "@/components/wallet/palette";
import { useBlockchain } from "@/hooks/use-blockchain";
import type {
  LeaderboardEntry,
  MockActivity,
  MockNFT,
  MockRoom,
  MockUser,
  MockWorldEvent,
  Quest,
} from "@/lib/mock/generators";

export function DemoWorldPanel() {
  const {
    isMock,
    getCurrentUser,
    getNFTs,
    getMatches,
    getLeaderboard,
    getQuests,
    getRooms,
    getWorldEvents,
    getActivity,
    getBalance,
    mintNFT,
    createMatch,
  } = useBlockchain();
  const [user, setUser] = useState<MockUser | null>(null);
  const [nftCount, setNftCount] = useState(0);
  const [ownedNfts, setOwnedNfts] = useState<MockNFT[]>([]);
  const [matchCount, setMatchCount] = useState(0);
  const [ranks, setRanks] = useState<LeaderboardEntry[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [rooms, setRooms] = useState<MockRoom[]>([]);
  const [events, setEvents] = useState<MockWorldEvent[]>([]);
  const [feed, setFeed] = useState<MockActivity[]>([]);
  const [balance, setBalance] = useState(0);
  const [status, setStatus] = useState("Mock world idle");

  const loadData = useCallback(async () => {
    if (!isMock) {
      setUser(null);
      setNftCount(0);
      setOwnedNfts([]);
      setMatchCount(0);
      setRanks([]);
      setQuests([]);
      setRooms([]);
      setEvents([]);
      setFeed([]);
      setBalance(0);
      return;
    }
    const [nextUser, nfts, owned, matches, board, nextQuests, nextRooms, nextEvents, nextFeed, nextBalance] =
      await Promise.all([
        getCurrentUser(),
        getNFTs(),
        getNFTs("user_0"),
        getMatches(),
        getLeaderboard(),
        getQuests(),
        getRooms(),
        getWorldEvents(),
        getActivity(),
        getBalance(),
      ]);
    setUser(nextUser);
    setNftCount(nfts.length);
    setOwnedNfts(owned.slice(0, 4));
    setMatchCount(matches.length);
    setRanks(board.slice(0, 8));
    setQuests(nextQuests.slice(0, 6));
    setRooms(nextRooms.slice(0, 5));
    setEvents(nextEvents.slice(0, 4));
    setFeed(nextFeed.slice(0, 5));
    setBalance(typeof nextBalance === "number" ? nextBalance : Number(nextBalance) || 0);
    setStatus("Seeded mock world loaded");
  }, [getActivity, getBalance, getCurrentUser, getLeaderboard, getMatches, getNFTs, getQuests, getRooms, getWorldEvents, isMock]);

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
    setStatus(nft ? `Minted ${nft.name} (${nft.rarity}) #${nft.id}` : "Mint failed");
    const nfts = await getNFTs();
    setNftCount(nfts.length);
    setOwnedNfts((await getNFTs("user_0")).slice(0, 4));
  };

  const handleMatch = async () => {
    const match = await createMatch([user?.id ?? "user_0"]);
    setStatus(match ? `Created ${match.id}` : "Match create failed");
    const matches = await getMatches();
    setMatchCount(matches.length);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>MOCK CHAIN · LOCALHOST DEMO</Text>
      <Text style={styles.title}>{user?.displayName ?? "Demo captain"}</Text>
      <Text style={styles.body}>
        {balance} FZONE · {nftCount} wearables · {matchCount} matches · {user ? `Lv ${user.level}` : "seed 42"} · {user?.reputation ?? 0} rep
      </Text>
      {ownedNfts.map((nft) => (
        <Text key={nft.id} style={styles.rank}>
          {nft.name} · {nft.rarity}
          {nft.staked ? " · staked" : ""}
        </Text>
      ))}
      {ranks.map((entry) => (
        <Text key={entry.userId} style={styles.rank}>
          #{entry.rank} {entry.displayName} · {entry.wins} wins
        </Text>
      ))}
      {rooms.map((room) => (
        <Text key={room.id} style={styles.rank}>
          {room.title} · {room.code} · {room.players}/{room.maxPlayers} {room.status}
        </Text>
      ))}
      {events.map((event) => (
        <Text key={event.id} style={styles.rank}>
          {event.status === "live" ? "LIVE" : "SOON"} {event.title} · {event.rsvpCount} RSVP
        </Text>
      ))}
      {quests.map((quest) => (
        <Text key={quest.id} style={styles.rank}>
          {quest.title} · {quest.progress}/{quest.target}
          {quest.completed ? " · done" : ""}
        </Text>
      ))}
      {feed.map((item) => (
        <Text key={item.id} style={styles.feed}>
          {item.displayName} {item.summary} · {item.minutesAgo}m
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
  feed: { color: C.fog, fontSize: 11, marginTop: 4, fontWeight: "600" },
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
