import { type ReactNode } from "react";
import { ScrollView, StyleSheet, View, type ViewProps } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { shouldSkipSafeArea, type ScreenInsetMode } from "@/lib/mobile";
import { cn } from "@/lib/utils";

export interface ScreenContainerProps extends ViewProps {
  /**
   * SafeArea edges to apply. Defaults to all edges now that the in-app
   * nav owns the bottom chrome instead of the Expo tab bar.
   */
  edges?: Edge[];
  /**
   * Decentraland-style inset mode.
   * `device` (default) clears hardware notches; `none` is full-bleed;
   * `interactable` keeps hardware insets in the companion (explorer chrome
   * is applied only in a DCL scene via `screenInset: 'interactable'`).
   */
  screenInset?: ScreenInsetMode;
  /**
   * Tailwind className for the content area.
   */
  className?: string;
  /**
   * Additional className for the outer container (background layer).
   */
  containerClassName?: string;
  /**
   * Additional className for the SafeAreaView (content layer).
   */
  safeAreaClassName?: string;
  /**
   * Scroll the main column so dense demo screens stay reachable on short phones.
   */
  scroll?: boolean;
  /**
   * Sticky chrome (tab bar, pull dock) that stays outside the scroll view.
   */
  footer?: ReactNode;
  /**
   * Full-screen overlays such as tutorials and countdowns.
   */
  overlay?: ReactNode;
}

/**
 * A container component that properly handles SafeArea and background colors.
 *
 * The outer View extends to full screen (including status bar area) with the background color,
 * while the inner SafeAreaView ensures content is within safe bounds.
 *
 * Usage:
 * ```tsx
 * <ScreenContainer className="p-4">
 *   <Text className="text-2xl font-bold text-foreground">
 *     Welcome
 *   </Text>
 * </ScreenContainer>
 * ```
 */
export function ScreenContainer({
  children,
  edges = ["top", "bottom", "left", "right"],
  screenInset = "device",
  className,
  containerClassName,
  safeAreaClassName,
  scroll = false,
  footer,
  overlay,
  style,
  ...props
}: ScreenContainerProps) {
  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    children
  );

  const content = (
    <View style={styles.shell}>
      <View className={cn("flex-1", className)}>{body}</View>
      {footer}
      {overlay ? (
        <View style={[StyleSheet.absoluteFill, styles.overlayLayer]}>
          {overlay}
        </View>
      ) : null}
    </View>
  );

  return (
    <View
      className={cn(
        "flex-1",
        "bg-background",
        containerClassName
      )}
      {...props}
    >
      {shouldSkipSafeArea(screenInset) ? (
        <View className={cn("flex-1", safeAreaClassName)} style={style}>
          {content}
        </View>
      ) : (
        <SafeAreaView
          edges={edges}
          className={cn("flex-1", safeAreaClassName)}
          style={style}
        >
          {content}
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  shell: { flex: 1 },
  overlayLayer: { pointerEvents: "box-none" },
  scrollContent: { paddingBottom: 12, flexGrow: 1 },
});
