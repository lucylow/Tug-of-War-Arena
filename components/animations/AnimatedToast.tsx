import { memo, useEffect, useRef } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";

import {
  ARENA_COLORS,
  SPRING_SNAP,
  TOAST_DURATION_MS,
  TOAST_ENTER_MS,
  TOAST_EXIT_MS,
  TYPOGRAPHY,
  toastPalette,
  type ToastType,
} from "@/lib/animations";

export interface AnimatedToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss?: () => void;
  action?: { label: string; onPress: () => void };
}

export const AnimatedToast = memo(function AnimatedToast({
  message,
  type = "info",
  duration = TOAST_DURATION_MS,
  onDismiss,
  action,
}: AnimatedToastProps) {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;
  const colors = toastPalette(type);

  useEffect(() => {
    translateY.value = withSpring(0, SPRING_SNAP);
    opacity.value = withTiming(1, { duration: TOAST_ENTER_MS });
    const hide = setTimeout(() => {
      translateY.value = withTiming(-100, { duration: TOAST_EXIT_MS, easing: Easing.out(Easing.ease) });
      opacity.value = withTiming(0, { duration: TOAST_EXIT_MS });
    }, duration);
    const done = setTimeout(() => onDismissRef.current?.(), duration + TOAST_EXIT_MS);
    return () => {
      clearTimeout(hide);
      clearTimeout(done);
    };
  }, [duration, opacity, translateY]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.container, containerStyle, { backgroundColor: colors.bg }]}
    >
      <View style={styles.content}>
        <Text style={styles.message}>{message}</Text>
        {action ? (
          <Pressable onPress={action.onPress} style={styles.action} accessibilityRole="button" accessibilityLabel={action.label}>
            <Text style={styles.actionText}>{action.label}</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={onDismiss} style={styles.close} accessibilityRole="button" accessibilityLabel="Dismiss notification">
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 20,
    left: 16,
    right: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 1000,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  message: {
    ...TYPOGRAPHY.body,
    color: ARENA_COLORS.ink,
    flex: 1,
    fontWeight: "700",
  },
  action: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "rgba(17,20,43,0.18)",
    borderRadius: 4,
  },
  actionText: {
    color: ARENA_COLORS.ink,
    fontWeight: "800",
  },
  close: {
    marginLeft: 8,
    padding: 4,
  },
  closeText: {
    color: ARENA_COLORS.ink,
    fontSize: 16,
  },
});
