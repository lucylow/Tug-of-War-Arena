import { StyleSheet, Text, View } from "react-native";

import { WALLET_COLORS as C } from "@/components/wallet/palette";
import { hideFromA11y } from "@/lib/a11y";
import { createCanonicalWorldFeed } from "@/shared/demo-world";
import type { WorldFeed } from "@/shared/friendzone-world-protocol";
import { projectWorldToMinimapPoints } from "@/lib/world";

const EXTENT = 32;

function pct(value: number): `${number}%` {
  const clamped = Math.max(6, Math.min(94, (value / EXTENT) * 100));
  return `${clamped}%`;
}

type Props = {
  feed?: WorldFeed | null;
};

export function WorldMiniMap({ feed }: Props) {
  const world = feed ?? createCanonicalWorldFeed();
  const points = projectWorldToMinimapPoints(world).filter((point) => point.kind === "player");

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`World mini-map. Governance north, events south, Sun west, Moon east, arena center. ${points.length} demo player markers.`}
      style={styles.map}
    >
      <View pointerEvents="none" style={styles.sun} {...hideFromA11y()} />
      <View pointerEvents="none" style={styles.moon} {...hideFromA11y()} />
      <View pointerEvents="none" style={styles.arena} {...hideFromA11y()} />
      <Text pointerEvents="none" style={[styles.label, styles.gov]} {...hideFromA11y()}>
        GOVERNANCE
      </Text>
      <Text pointerEvents="none" style={[styles.label, styles.events]} {...hideFromA11y()}>
        EVENTS
      </Text>
      <Text pointerEvents="none" style={[styles.label, styles.sunLabel]} {...hideFromA11y()}>
        SUN
      </Text>
      <Text pointerEvents="none" style={[styles.label, styles.moonLabel]} {...hideFromA11y()}>
        MOON
      </Text>
      <Text pointerEvents="none" style={[styles.label, styles.arenaLabel]} {...hideFromA11y()}>
        ARENA
      </Text>
      {points.map((point) => (
        <View
          key={point.id}
          pointerEvents="none"
          style={[
            styles.dot,
            {
              left: pct(point.x),
              top: pct(point.z),
              backgroundColor: point.team === "sun" ? C.coral : C.cyan,
            },
          ]}
          {...hideFromA11y()}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 168,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#12163A",
    borderWidth: 1,
    borderColor: C.border,
    position: "relative",
  },
  sun: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "28%",
    backgroundColor: "#FF6B6B22",
  },
  moon: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "28%",
    backgroundColor: "#4DE7F222",
  },
  arena: {
    position: "absolute",
    left: "38%",
    top: "36%",
    width: "24%",
    height: "28%",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.gold,
    backgroundColor: "#FFC85722",
  },
  label: {
    position: "absolute",
    color: C.fog,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  gov: { top: 8, alignSelf: "center", left: "36%" },
  events: { bottom: 8, left: "40%" },
  sunLabel: { left: 8, top: "46%" },
  moonLabel: { right: 8, top: "46%" },
  arenaLabel: { left: "42%", top: "46%", color: C.gold },
  dot: {
    position: "absolute",
    width: 8,
    height: 8,
    marginLeft: -4,
    marginTop: -4,
    borderRadius: 4,
  },
});
