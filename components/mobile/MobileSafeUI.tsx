import { type ReactNode } from "react";
import { View, type StyleProp, type ViewProps, type ViewStyle } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { getSafeZone, shouldSkipSafeArea, type ScreenInsetMode } from "@/lib/mobile";

export interface MobileSafeUIProps extends ViewProps {
  children: ReactNode;
  /**
   * `device` — hardware insets via SafeAreaView (default).
   * `interactable` — hardware insets plus the companion/DCL safe-zone band.
   * `none` — full-bleed; caller owns margins.
   */
  screenInset?: ScreenInsetMode;
  edges?: Edge[];
}

/**
 * Analog of DCL `ScreenInsetArea` / `InteractableArea` for the Expo companion.
 * `position` is owned by the inset — callers should not absolutely pin this wrapper.
 */
export function MobileSafeUI({
  children,
  screenInset = "device",
  edges = ["top", "left", "right"],
  style,
  ...props
}: MobileSafeUIProps) {
  const content = (
    <InteractableBand enabled={screenInset === "interactable"} style={style}>
      {children}
    </InteractableBand>
  );

  if (shouldSkipSafeArea(screenInset)) {
    return (
      <View style={[{ flex: 1 }, style]} {...props}>
        {children}
      </View>
    );
  }

  return (
    <SafeAreaView edges={edges} style={{ flex: 1 }} {...props}>
      {content}
    </SafeAreaView>
  );
}

function InteractableBand({
  enabled,
  children,
  style,
}: {
  enabled: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  if (!enabled) {
    return <View style={[{ flex: 1 }, style]}>{children}</View>;
  }

  const zone = getSafeZone();
  const left = `${zone.x[0] * 100}%` as const;
  const top = `${zone.y[0] * 100}%` as const;
  const width = `${(zone.x[1] - zone.x[0]) * 100}%` as const;
  const height = `${(zone.y[1] - zone.y[0]) * 100}%` as const;

  return (
    <View style={{ flex: 1 }}>
      <View
        style={[
          {
            position: "absolute",
            left,
            top,
            width,
            height,
            justifyContent: "center",
            alignItems: "center",
          },
          style,
        ]}
      >
        {children}
      </View>
    </View>
  );
}
