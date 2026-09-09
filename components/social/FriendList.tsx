import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { WALLET_COLORS as C } from "@/components/wallet/palette";
import { useSocial } from "@/hooks/use-social";
import type { FriendRequest, SocialFriend } from "@/lib/social/types";

export function FriendList() {
  const {
    friend,
    fetchFriends,
    fetchFriendRequests,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    searchUsers,
    clearSearch,
  } = useSocial();
  const [tab, setTab] = useState<"friends" | "requests" | "search">("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    void fetchFriends();
    void fetchFriendRequests();
  }, [fetchFriends, fetchFriendRequests]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim().length > 2) {
      setSearching(true);
      void searchUsers(text).finally(() => setSearching(false));
    } else {
      clearSearch();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {(
          [
            ["friends", `Friends (${friend.friends.length})`],
            ["requests", `Requests (${friend.pendingRequests.length})`],
            ["search", "Find"],
          ] as const
        ).map(([key, label]) => (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === key }}
            accessibilityLabel={label}
            onPress={() => setTab(key)}
            style={({ pressed }) => [styles.tab, tab === key && styles.activeTab, pressed && styles.pressed]}
          >
            <Text style={[styles.tabText, tab === key && styles.activeText]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {friend.loading && tab === "friends" ? (
        <ActivityIndicator accessibilityLabel="Loading friends" color={C.gold} style={styles.loader} />
      ) : tab === "friends" ? (
        <FriendRows friends={friend.friends} />
      ) : tab === "requests" ? (
        <RequestRows
          requests={friend.pendingRequests}
          onAccept={(id) => void acceptFriendRequest(id)}
          onReject={(id) => void rejectFriendRequest(id)}
        />
      ) : (
        <View>
          <TextInput
            accessibilityLabel="Search players by name"
            style={styles.searchInput}
            placeholder="Search by name..."
            placeholderTextColor={C.fog}
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searching ? <ActivityIndicator color={C.gold} /> : null}
          {friend.searchResults.map((item) => (
            <SearchRow
              key={item.id}
              item={item}
              isFriend={friend.friends.some((entry) => entry.id === item.id) || item.isFriend}
              onAdd={() => void sendFriendRequest(item.id)}
            />
          ))}
        </View>
      )}
      {friend.error ? <Text style={styles.error}>{friend.error}</Text> : null}
    </View>
  );
}

function FriendRows({ friends }: { friends: SocialFriend[] }) {
  if (friends.length === 0) {
    return <Text style={styles.empty}>No friends yet. Find a puller in the Plaza.</Text>;
  }
  return (
    <View>
      {friends.map((item) => (
        <View key={item.id} style={styles.row}>
          <Avatar size={40} uri={item.avatarUrl} name={item.displayName} />
          <View style={styles.copy}>
            <Text style={styles.name}>{item.displayName}</Text>
            <View style={styles.statusRow}>
              <Badge status={item.status} />
              <Text style={styles.meta}>{item.wins} wins</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

function RequestRows({
  requests,
  onAccept,
  onReject,
}: {
  requests: FriendRequest[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}) {
  if (requests.length === 0) {
    return <Text style={styles.empty}>No pending requests.</Text>;
  }
  return (
    <View>
      {requests.map((item) => (
        <View key={item.id} style={styles.row}>
          <Avatar size={40} uri={item.fromAvatarUrl} name={item.fromDisplayName} />
          <View style={styles.copy}>
            <Text style={styles.name}>{item.fromDisplayName}</Text>
            <Text style={styles.meta}>{new Date(item.sentAt).toLocaleDateString()}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Accept friend request from ${item.fromDisplayName}`}
            onPress={() => onAccept(item.id)}
            style={({ pressed }) => [styles.roundButton, styles.accept, pressed && styles.pressed]}
          >
            <Text style={styles.roundText}>✓</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Reject friend request from ${item.fromDisplayName}`}
            onPress={() => onReject(item.id)}
            style={({ pressed }) => [styles.roundButton, styles.reject, pressed && styles.pressed]}
          >
            <Text style={styles.roundText}>✕</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

function SearchRow({
  item,
  isFriend,
  onAdd,
}: {
  item: SocialFriend;
  isFriend: boolean;
  onAdd: () => void;
}) {
  return (
    <View style={styles.row}>
      <Avatar size={36} uri={item.avatarUrl} name={item.displayName} />
      <Text style={[styles.name, styles.copy]}>{item.displayName}</Text>
      {isFriend ? (
        <Badge label="Friend" color={C.mint} />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Send friend request to ${item.displayName}`}
          onPress={onAdd}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
        >
          <Text style={styles.addText}>+</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%" },
  tabs: { flexDirection: "row", backgroundColor: C.midnight, borderRadius: 16, padding: 4, marginBottom: 10 },
  tab: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 12 },
  activeTab: { backgroundColor: C.panel },
  tabText: { color: C.fog, fontSize: 11, fontWeight: "800" },
  activeText: { color: C.gold },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 62,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 8,
  },
  copy: { flex: 1, marginLeft: 10 },
  name: { color: C.cloud, fontSize: 14, fontWeight: "800" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  meta: { color: C.fog, fontSize: 11 },
  roundButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  accept: { backgroundColor: C.mint },
  reject: { backgroundColor: C.coral },
  roundText: { color: C.ink, fontSize: 18, fontWeight: "900" },
  searchInput: {
    backgroundColor: C.midnight,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 44,
    color: C.cloud,
    marginBottom: 8,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  addText: { color: C.ink, fontSize: 22, fontWeight: "900" },
  empty: { color: C.fog, textAlign: "center", marginTop: 24, fontSize: 13 },
  loader: { marginTop: 24 },
  error: { color: C.coral, fontSize: 12, marginTop: 8 },
  pressed: { opacity: 0.78 },
});
