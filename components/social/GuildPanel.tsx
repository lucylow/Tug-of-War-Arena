import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { WALLET_COLORS as C } from "@/components/wallet/palette";
import { useSocial } from "@/hooks/use-social";

export function GuildPanel() {
  const { guild, fetchMyGuild, fetchGuilds, createGuild, joinGuild, leaveGuild } = useSocial();
  const [showCreate, setShowCreate] = useState(false);
  const [newGuild, setNewGuild] = useState({ name: "", tag: "", description: "" });

  useEffect(() => {
    void fetchMyGuild();
    void fetchGuilds();
  }, [fetchGuilds, fetchMyGuild]);

  const handleCreate = () => {
    if (!newGuild.name.trim() || newGuild.tag.trim().length < 2) return;
    void createGuild(newGuild).then(() => {
      setShowCreate(false);
      setNewGuild({ name: "", tag: "", description: "" });
    });
  };

  if (guild.myGuild) {
    const mine = guild.myGuild;
    return (
      <View>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{mine.name}</Text>
          <Text style={styles.tag}>[{mine.tag}]</Text>
          <Text style={styles.rep}>★ {mine.reputation}</Text>
        </View>
        <Text style={styles.body}>{mine.description}</Text>
        <Text style={styles.section}>Members ({mine.memberCount})</Text>
        {mine.members.map((member) => (
          <View key={member.userId} style={styles.row}>
            <Avatar size={32} uri={member.avatarUrl} name={member.displayName} />
            <Text style={styles.name}>{member.displayName}</Text>
            <Text style={styles.meta}>{member.role}</Text>
          </View>
        ))}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Leave guild"
          onPress={() => void leaveGuild()}
          style={({ pressed }) => [styles.leave, pressed && styles.pressed]}
        >
          <Text style={styles.leaveText}>LEAVE GUILD</Text>
        </Pressable>
      </View>
    );
  }

  if (showCreate) {
    return (
      <View>
        <Text style={styles.title}>Create Guild</Text>
        <TextInput
          accessibilityLabel="Guild name"
          style={styles.input}
          placeholder="Name"
          placeholderTextColor={C.fog}
          value={newGuild.name}
          onChangeText={(text) => setNewGuild({ ...newGuild, name: text })}
        />
        <TextInput
          accessibilityLabel="Guild tag"
          style={styles.input}
          placeholder="Tag (2-5 chars)"
          placeholderTextColor={C.fog}
          value={newGuild.tag}
          onChangeText={(text) => setNewGuild({ ...newGuild, tag: text.toUpperCase() })}
          maxLength={5}
          autoCapitalize="characters"
        />
        <TextInput
          accessibilityLabel="Guild description"
          style={[styles.input, styles.textArea]}
          placeholder="Description"
          placeholderTextColor={C.fog}
          value={newGuild.description}
          onChangeText={(text) => setNewGuild({ ...newGuild, description: text })}
          multiline
        />
        {guild.error ? <Text style={styles.error}>{guild.error}</Text> : null}
        <Button title="CREATE" onPress={handleCreate} />
        <Button title="CANCEL" type="secondary" onPress={() => setShowCreate(false)} />
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.title}>Guilds</Text>
      <Button title="CREATE GUILD" onPress={() => setShowCreate(true)} />
      {guild.guilds.map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="button"
          accessibilityLabel={`Join ${item.name}`}
          onPress={() => void joinGuild(item.id)}
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        >
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.tag}>[{item.tag}]</Text>
          <Text style={styles.meta}>{item.memberCount} members</Text>
        </Pressable>
      ))}
      {guild.guilds.length === 0 ? <Text style={styles.empty}>No guilds found.</Text> : null}
      {guild.error ? <Text style={styles.error}>{guild.error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  title: { color: C.cloud, fontSize: 20, fontWeight: "900" },
  tag: { color: C.gold, marginLeft: 8, fontWeight: "800" },
  rep: { color: C.fog, marginLeft: "auto", fontWeight: "700" },
  body: { color: C.fog, fontSize: 13, lineHeight: 18, marginBottom: 10 },
  section: { color: C.fog, fontSize: 10, fontWeight: "900", letterSpacing: 1.2, marginVertical: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  name: { flex: 1, marginLeft: 10, color: C.cloud, fontWeight: "800" },
  meta: { fontSize: 12, color: C.fog },
  leave: {
    marginTop: 16,
    backgroundColor: C.coral,
    minHeight: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  leaveText: { color: C.cloud, fontWeight: "900", letterSpacing: 0.8 },
  input: {
    backgroundColor: C.midnight,
    paddingHorizontal: 12,
    minHeight: 44,
    borderRadius: 12,
    color: C.cloud,
    marginBottom: 10,
  },
  textArea: { height: 80, textAlignVertical: "top", paddingTop: 12 },
  card: {
    backgroundColor: C.midnight,
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
  },
  empty: { color: C.fog, textAlign: "center", marginTop: 24 },
  error: { color: C.coral, fontSize: 12, marginTop: 8 },
  pressed: { opacity: 0.78 },
});
