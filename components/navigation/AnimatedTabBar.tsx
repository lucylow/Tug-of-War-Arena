import { memo, useEffect } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { ARENA_COLORS, SPRING_SOFT, TYPOGRAPHY } from "@/lib/animations";

const { width: WINDOW_WIDTH } = Dimensions.get("window");

export interface TabItem {
  key: string;
  title: string;
  icon: string;
}

export interface AnimatedTabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabPress: (key: string) => void;
  reduceMotion?: boolean;
}

export const AnimatedTabBar = memo(function AnimatedTabBar({
  tabs,
  activeTab,
  onTabPress,
  reduceMotion = false,
}: AnimatedTabBarProps) {
  const tabWidth = WINDOW_WIDTH / Math.max(tabs.length, 1);
  const activeIndex = Math.max(0, tabs.findIndex((tab) => tab.key === activeTab));
  const indicatorPosition = useSharedValue(activeIndex * tabWidth);

  useEffect(() => {
    if (reduceMotion) {
      indicatorPosition.value = activeIndex * tabWidth;
      return;
    }
    indicatorPosition.value = withSpring(activeIndex * tabWidth, SPRING_SOFT);
  }, [activeIndex, indicatorPosition, reduceMotion, tabWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorPosition.value }],
    width: tabWidth,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        {tabs.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={tab.title}
              style={styles.tab}
              onPress={() => onTabPress(tab.key)}
            >
              <Text style={styles.icon}>{tab.icon}</Text>
              <Text style={[styles.title, active && styles.activeTitle]}>{tab.title}</Text>
            </Pressable>
          );
        })}
      </View>
      <Animated.View style={[styles.indicator, indicatorStyle]} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: ARENA_COLORS.panel,
    borderTopWidth: 1,
    borderTopColor: ARENA_COLORS.midnight,
  },
  tabContainer: {
    flexDirection: "row",
    height: 64,
    position: "relative",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  icon: { fontSize: 22 },
  title: { ...TYPOGRAPHY.caption, color: ARENA_COLORS.fog, marginTop: 2 },
  activeTitle: { color: ARENA_COLORS.primary },
  indicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: 3,
    backgroundColor: ARENA_COLORS.primary,
    borderRadius: 2,
  },
});
