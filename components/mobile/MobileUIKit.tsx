import { type ReactNode } from "react";
import { Pressable, Text, View, type ViewStyle } from "react-native";

import {
  BUTTON_HEIGHT,
  FONT_SIZE_BODY,
  FONT_SIZE_HEADING,
  isMobile,
  touchTargetSize,
} from "@/lib/mobile";

const COLORS = {
  card: "#1D2150",
  ink: "#11142B",
  cloud: "#F5F7FF",
  fog: "#A8B0D8",
  gold: "#FFC857",
  button: "#4D96FF",
  track: "#252A5E",
};

type Align = "flex-start" | "center" | "flex-end" | "space-between";

export function MobileContainer({
  children,
  fullscreen = false,
}: {
  children: ReactNode;
  fullscreen?: boolean;
}) {
  return (
    <View
      style={{
        flex: fullscreen ? 1 : undefined,
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {children}
    </View>
  );
}

export function MobileCard({
  children,
  width = "80%",
  padding,
  backgroundColor = COLORS.card,
}: {
  children: ReactNode;
  width?: ViewStyle["width"];
  padding?: number;
  backgroundColor?: string;
}) {
  return (
    <View
      style={{
        width,
        padding: padding ?? (isMobile() ? 24 : 16),
        justifyContent: "center",
        alignItems: "center",
        backgroundColor,
      }}
    >
      {children}
    </View>
  );
}

export function MobileButton({
  text,
  onPress,
  width,
  height,
  fontSize,
  color = COLORS.cloud,
  backgroundColor = COLORS.button,
  accessibilityLabel,
}: {
  text: string;
  onPress: () => void;
  width?: number;
  height?: number;
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  accessibilityLabel?: string;
}) {
  const onMobile = isMobile();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? text}
      onPress={onPress}
      style={({ pressed }) => ({
        width: touchTargetSize(width ?? 160),
        height: touchTargetSize(height ?? BUTTON_HEIGHT),
        justifyContent: "center",
        alignItems: "center",
        backgroundColor,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text
        style={{
          color,
          fontSize: fontSize ?? (onMobile ? FONT_SIZE_BODY : 16),
          fontWeight: "700",
        }}
      >
        {text}
      </Text>
    </Pressable>
  );
}

export function MobileTitle({
  text,
  fontSize,
  color = COLORS.cloud,
}: {
  text: string;
  fontSize?: number;
  color?: string;
}) {
  return (
    <Text
      style={{
        color,
        fontSize: fontSize ?? (isMobile() ? FONT_SIZE_HEADING : 32),
        fontWeight: "800",
        textAlign: "center",
      }}
    >
      {text}
    </Text>
  );
}

export function MobileBody({
  text,
  fontSize,
  color = COLORS.fog,
}: {
  text: string;
  fontSize?: number;
  color?: string;
}) {
  return (
    <Text
      style={{
        color,
        fontSize: fontSize ?? (isMobile() ? FONT_SIZE_BODY : 16),
        textAlign: "center",
      }}
    >
      {text}
    </Text>
  );
}

export function MobilePowerBar({
  label,
  value,
  maxValue,
  color,
  width,
}: {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  width?: number;
}) {
  const onMobile = isMobile();
  const barWidth = width ?? (onMobile ? 200 : 300);
  const percentage = maxValue <= 0 ? 0 : Math.min(100, (value / maxValue) * 100);

  return (
    <View style={{ width: barWidth, minHeight: 30, alignItems: "center" }}>
      <Text style={{ color, fontSize: onMobile ? 14 : 12, fontWeight: "700" }}>{label}</Text>
      <View style={{ width: "100%", height: 20, backgroundColor: COLORS.track, justifyContent: "center" }}>
        <View style={{ width: `${percentage}%`, height: "100%", backgroundColor: color }} />
      </View>
    </View>
  );
}

export function MobileSafeContainer({
  children,
  justifyContent = "center",
  alignItems = "center",
}: {
  children: ReactNode;
  justifyContent?: Align;
  alignItems?: Exclude<Align, "space-between">;
}) {
  return (
    <View
      style={{
        flex: 1,
        width: "100%",
        justifyContent,
        alignItems,
      }}
    >
      {children}
    </View>
  );
}

export const MobileUI = {
  Container: MobileContainer,
  Card: MobileCard,
  Button: MobileButton,
  Title: MobileTitle,
  Body: MobileBody,
  PowerBar: MobilePowerBar,
};
