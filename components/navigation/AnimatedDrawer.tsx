import { memo, useEffect } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";

import { ARENA_COLORS, SPRING_SNAP, TYPOGRAPHY } from "@/lib/animations";

const { width: WINDOW_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = WINDOW_WIDTH * 0.75;

export interface DrawerItem {
  key: string;
  label: string;
  icon: string;
  onPress: () => void;
}

export interface AnimatedDrawerProps {
  visible: boolean;
  onClose: () => void;
  items: DrawerItem[];
  reduceMotion?: boolean;
}

export const AnimatedDrawer = memo(function AnimatedDrawer({
  visible,
  onClose,
  items,
  reduceMotion = false,
}: AnimatedDrawerProps) {
  const translateX = useSharedValue(visible && reduceMotion ? 0 : -DRAWER_WIDTH);
  const overlayOpacity = useSharedValue(visible && reduceMotion ? 0.5 : 0);

  useEffect(() => {
    if (reduceMotion) {
      translateX.value = visible ? 0 : -DRAWER_WIDTH;
      overlayOpacity.value = visible ? 0.5 : 0;
      return;
    }
    if (visible) {
      translateX.value = withSpring(0, SPRING_SNAP);
      overlayOpacity.value = withTiming(0.5, { duration: 240 });
    } else {
      translateX.value = withSpring(-DRAWER_WIDTH, SPRING_SNAP);
      overlayOpacity.value = withTiming(0, { duration: 240 });
    }
  }, [overlayOpacity, reduceMotion, translateX, visible]);

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  return (
    <View
      style={[styles.container, { pointerEvents: visible ? "auto" : "none" }]}
      accessibilityViewIsModal={visible}
    >
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <Pressable style={styles.touchArea} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close menu" />
      </Animated.View>
      <Animated.View style={[styles.drawer, drawerStyle]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>⚔️ Menu</Text>
          <Pressable onPress={onClose} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Close menu">
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>
        {items.map((item) => (
          <Pressable
            key={item.key}
            style={styles.item}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            onPress={() => {
              item.onPress();
              onClose();
            }}
          >
            <Text style={styles.itemIcon}>{item.icon}</Text>
            <Text style={styles.itemLabel}>{item.label}</Text>
          </Pressable>
        ))}
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, zIndex: 1000 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  touchArea: { flex: 1 },
  drawer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: ARENA_COLORS.midnight,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: { ...TYPOGRAPHY.h2, color: ARENA_COLORS.cloud },
  closeButton: { padding: 8, minHeight: 44, minWidth: 44, justifyContent: "center", alignItems: "center" },
  closeText: { fontSize: 24, color: ARENA_COLORS.fog },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    minHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: ARENA_COLORS.panel,
  },
  itemIcon: { fontSize: 24, marginRight: 12 },
  itemLabel: { ...TYPOGRAPHY.body, color: ARENA_COLORS.cloud, fontWeight: "700" },
});
