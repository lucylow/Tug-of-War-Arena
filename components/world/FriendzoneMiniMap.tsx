import { Pressable, StyleSheet, Text, View } from "react-native";

import { WALLET_COLORS as C } from "@/components/wallet/palette";
import { REGIONS, type WorldRegionId } from "@/shared/regions";
import { worldToMiniMap, type WorldCoordinate } from "@/shared/worldCoordinate";
import { hideFromA11y } from "@/lib/a11y";

type Marker = { id: string; position: WorldCoordinate; color: string; label: string };

type Props = {
  players?: Marker[];
  onSelectRegion?: (id: WorldRegionId) => void;
};

const REGION_COLORS: Record<WorldRegionId, string> = {
  spawn: "#8EC8F0",
  sunBase: "#F4A261",
  moonBase: "#9B8CFF",
  arena: "#FFC857",
  social: "#E56B9A",
  events: "#72F2B6",
  governance: "#A78BFA",
  achievements: "#FFC857",
};

export function FriendzoneMiniMap({ players = [], onSelectRegion }: Props) {
  return (
    <View accessibilityLabel="Friendzone mini-map" style={styles.map}>
      {(Object.keys(REGIONS) as WorldRegionId[]).map((id) => {
        const region = REGIONS[id];
        const point = worldToMiniMap(region.center);
        return (
          <Pressable
            key={id}
            accessibilityRole="button"
            accessibilityLabel={region.label}
            hitSlop={8}
            onPress={() => onSelectRegion?.(id)}
            style={[
              styles.region,
              {
                left: `${point.x * 100}%`,
                top: `${point.y * 100}%`,
                backgroundColor: `${REGION_COLORS[id]}55`,
                borderColor: REGION_COLORS[id],
              },
            ]}
          />
        );
      })}
      {players.slice(0, 12).map((player) => {
        const point = worldToMiniMap(player.position);
        return (
          <View
            key={player.id}
            pointerEvents="none"
            style={[
              styles.player,
              { left: `${point.x * 100}%`, top: `${point.y * 100}%`, backgroundColor: player.color },
            ]}
            {...hideFromA11y()}
          />
        );
      })}
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
  region: {
    position: "absolute",
    width: 22,
    height: 22,
    marginLeft: -11,
    marginTop: -11,
    borderRadius: 11,
    borderWidth: 1,
  },
  player: {
    position: "absolute",
    width: 10,
    height: 10,
    marginLeft: -5,
    marginTop: -5,
    borderRadius: 5,
  },
});
