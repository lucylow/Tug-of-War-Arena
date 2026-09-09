import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { WALLET_COLORS as C } from "@/components/wallet/palette";
import { useSocial } from "@/hooks/use-social";
import { visibleChatMessages } from "@/lib/social/reducers";
import type { ChatChannel, ChatMessage } from "@/lib/social/types";

export function ChatBox({
  channel,
  recipientId,
  recipientName,
}: {
  channel: ChatChannel;
  recipientId?: string;
  recipientName?: string;
}) {
  const { chat, currentUserId, fetchChatHistory, sendChat, markChannelRead } = useSocial();
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    void fetchChatHistory(channel);
    markChannelRead(channel);
  }, [channel, fetchChatHistory, markChannelRead]);

  const messages = visibleChatMessages(chat.messages, channel, recipientId);

  const send = () => {
    const content = inputText.trim();
    if (!content) return;
    void sendChat({
      senderId: currentUserId,
      senderName: "You",
      senderAvatar: "",
      content,
      channel,
      recipientId,
    });
    setInputText("");
  };

  const title =
    channel === "global" ? "Global Chat" : channel === "party" ? "Party Chat" : `Chat with ${recipientName ?? "User"}`;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{title}</Text>
      <ScrollView
        ref={scrollRef}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((item) => (
          <MessageBubble key={item.id} item={item} isOwn={item.senderId === currentUserId} />
        ))}
      </ScrollView>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.inputRow}>
          <TextInput
            accessibilityLabel="Chat message"
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={C.fog}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send chat message"
            onPress={send}
            style={({ pressed }) => [styles.send, pressed && styles.pressed]}
          >
            <Text style={styles.sendText}>SEND</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function MessageBubble({ item, isOwn }: { item: ChatMessage; isOwn: boolean }) {
  return (
    <View style={[styles.messageRow, isOwn ? styles.ownRow : styles.otherRow]}>
      {!isOwn ? <Avatar size={30} uri={item.senderAvatar} name={item.senderName} /> : null}
      <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
        {!isOwn ? <Text style={styles.sender}>{item.senderName}</Text> : null}
        <Text style={[styles.body, isOwn && styles.ownBody]}>{item.content}</Text>
        <Text style={styles.time}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 280 },
  header: { color: C.cloud, fontSize: 16, fontWeight: "900", marginBottom: 8 },
  list: { maxHeight: 220 },
  listContent: { paddingVertical: 4, gap: 8 },
  messageRow: { flexDirection: "row", alignItems: "flex-start" },
  ownRow: { justifyContent: "flex-end" },
  otherRow: { justifyContent: "flex-start" },
  bubble: { maxWidth: "75%", padding: 10, borderRadius: 14, marginHorizontal: 6 },
  ownBubble: { backgroundColor: C.gold, marginLeft: "auto" },
  otherBubble: { backgroundColor: C.midnight },
  sender: { fontSize: 11, fontWeight: "800", color: C.fog, marginBottom: 2 },
  body: { color: C.cloud, fontSize: 14, lineHeight: 20 },
  ownBody: { color: C.ink },
  time: { fontSize: 10, color: C.fog, alignSelf: "flex-end", marginTop: 4 },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 8,
  },
  input: {
    flex: 1,
    backgroundColor: C.midnight,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: C.cloud,
    maxHeight: 100,
    minHeight: 44,
  },
  send: {
    minHeight: 44,
    minWidth: 64,
    borderRadius: 16,
    backgroundColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  sendText: { color: C.ink, fontWeight: "900", fontSize: 11, letterSpacing: 0.8 },
  pressed: { opacity: 0.78 },
});
