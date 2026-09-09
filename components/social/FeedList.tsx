import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { WALLET_COLORS as C } from "@/components/wallet/palette";
import { useSocial } from "@/hooks/use-social";
import { fromNow } from "@/lib/social/time";
import type { FeedItem } from "@/lib/social/types";

function actionCopy(item: FeedItem): string {
  if (item.action === "match_won") return "Won a match!";
  if (item.action === "match_lost") return "Lost a match";
  if (item.action === "achievement") return `Earned "${item.details.badgeName ?? "a badge"}"`;
  if (item.action === "friend_added") return `Became friends with ${item.details.friendName ?? "a puller"}`;
  return `Joined guild "${item.details.guildName ?? "a crew"}"`;
}

export function FeedList() {
  const { feed, fetchFeed, likeFeedItem } = useSocial();

  useEffect(() => {
    void fetchFeed(1);
  }, [fetchFeed]);

  return (
    <View>
      {feed.items.map((item) => (
        <View key={item.id} style={styles.card}>
          <View style={styles.header}>
            <Avatar size={40} uri={item.avatarUrl} name={item.displayName} />
            <Text style={styles.name}>{item.displayName}</Text>
            <Text style={styles.time}>{fromNow(item.timestamp)}</Text>
          </View>
          <Text style={styles.action}>{actionCopy(item)}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${item.liked ? "Unlike" : "Like"} ${item.displayName}'s update`}
            accessibilityState={{ selected: item.liked }}
            onPress={() => void likeFeedItem(item.id)}
            style={({ pressed }) => [styles.like, pressed && styles.pressed]}
          >
            <Text style={styles.heart}>{item.liked ? "♥" : "♡"}</Text>
            <Text style={styles.count}>{item.likes}</Text>
          </Pressable>
        </View>
      ))}
      {feed.hasMore ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Load more activity"
          onPress={() => void fetchFeed(feed.page + 1)}
          style={({ pressed }) => [styles.more, pressed && styles.pressed]}
        >
          <Text style={styles.moreText}>{feed.loading ? "LOADING…" : "LOAD MORE"}</Text>
        </Pressable>
      ) : null}
      {feed.items.length === 0 && !feed.loading ? <Text style={styles.empty}>No activity yet.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.midnight,
    marginBottom: 8,
    padding: 12,
    borderRadius: 14,
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  name: { color: C.cloud, marginLeft: 8, flex: 1, fontWeight: "800" },
  time: { fontSize: 11, color: C.fog },
  action: { color: C.cloud, fontSize: 14, marginBottom: 8 },
  like: { flexDirection: "row", alignItems: "center", minHeight: 44, alignSelf: "flex-start", paddingRight: 8 },
  heart: { fontSize: 18, color: C.coral, marginRight: 6 },
  count: { fontSize: 13, color: C.fog, fontWeight: "700" },
  more: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  moreText: { color: C.gold, fontWeight: "900", letterSpacing: 0.8, fontSize: 11 },
  empty: { color: C.fog, textAlign: "center", marginTop: 24 },
  pressed: { opacity: 0.78 },
});
