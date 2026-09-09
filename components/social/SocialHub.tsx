import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ChatBox } from "@/components/social/ChatBox";
import { FeedList } from "@/components/social/FeedList";
import { FriendList } from "@/components/social/FriendList";
import { GuildPanel } from "@/components/social/GuildPanel";
import { SocialLeaderboard } from "@/components/social/SocialLeaderboard";
import { WALLET_COLORS as C } from "@/components/wallet/palette";

const TABS = [
  { key: "friends", label: "Friends" },
  { key: "chat", label: "Chat" },
  { key: "guilds", label: "Guilds" },
  { key: "feed", label: "Feed" },
  { key: "leaderboard", label: "Ranks" },
] as const;

type HubTab = (typeof TABS)[number]["key"];

export function SocialHub() {
  const [activeTab, setActiveTab] = useState<HubTab>("friends");

  return (
    <View accessibilityLabel="Social hub" style={styles.container}>
      <Text style={styles.kicker}>SOCIAL LAYER</Text>
      <Text style={styles.title}>Crew lounge extras</Text>
      <Text style={styles.body}>Friends, live chat, guilds, activity, and ranks — playable offline for the Friendzone demo.</Text>
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab.key }}
            accessibilityLabel={tab.label}
            onPress={() => setActiveTab(tab.key)}
            style={({ pressed }) => [styles.tab, activeTab === tab.key && styles.activeTab, pressed && styles.pressed]}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeText]} numberOfLines={1}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.content}>
        {activeTab === "friends" ? <FriendList /> : null}
        {activeTab === "chat" ? <ChatBox channel="global" /> : null}
        {activeTab === "guilds" ? <GuildPanel /> : null}
        {activeTab === "feed" ? <FeedList /> : null}
        {activeTab === "leaderboard" ? <SocialLeaderboard /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: C.panel,
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#3A407A",
  },
  kicker: { color: C.gold, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  title: { color: C.cloud, fontSize: 18, fontWeight: "900", marginTop: 6 },
  body: { color: C.fog, fontSize: 13, lineHeight: 18, marginTop: 6, marginBottom: 12 },
  tabs: {
    flexDirection: "row",
    backgroundColor: C.midnight,
    borderRadius: 16,
    padding: 4,
    marginBottom: 12,
    gap: 2,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 4,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTab: { backgroundColor: C.gold },
  tabText: { color: C.fog, fontSize: 11, fontWeight: "800" },
  activeText: { color: C.ink },
  content: { minHeight: 180 },
  pressed: { opacity: 0.78 },
});
