import { StyleSheet, View } from "react-native";

import { WALLET_COLORS as C } from "@/components/wallet/palette";
import { hideFromA11y } from "@/lib/a11y";
import { scaleMapX, scaleMapY, type HybridWorldDataset } from "@/lib/hybrid-world";

type Props = {
  dataset: HybridWorldDataset;
};

export function WorldMiniMap2D({ dataset }: Props) {
  const players = Array.isArray(dataset?.players)
    ? dataset.players.filter((player) => player?.presence !== "offline").slice(0, 18)
    : [];

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`World mini-map with ${players.length} projected avatars. Sun base west, moon base east, arena center.`}
      style={styles.map}
    >
      <View pointerEvents="none" style={styles.sunZone} {...hideFromA11y()} />
      <View pointerEvents="none" style={styles.moonZone} {...hideFromA11y()} />
      <View pointerEvents="none" style={styles.arena} {...hideFromA11y()} />
      {players.map((player, index) => (
        <View
          key={player.id || `player_${index}`}
          pointerEvents="none"
          style={[
            styles.playerMarker,
            {
              left: `${scaleMapX(player.spawn?.x)}%`,
              top: `${scaleMapY(player.spawn?.z)}%`,
              backgroundColor: player.team === "sun" ? C.coral : C.cyan,
              borderColor: player.isHighlighted ? C.gold : "transparent",
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
    height: 148,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#12163A",
    borderWidth: 1,
    borderColor: C.border,
    position: "relative",
  },
  sunZone: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "34%",
    backgroundColor: "#FF6B6B22",
  },
  moonZone: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "34%",
    backgroundColor: "#4DE7F222",
  },
  arena: {
    position: "absolute",
    left: "36%",
    top: "28%",
    width: "28%",
    height: "44%",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.gold,
    backgroundColor: "#FFC85722",
  },
  playerMarker: {
    position: "absolute",
    width: 10,
    height: 10,
    marginLeft: -5,
    marginTop: -5,
    borderRadius: 5,
    borderWidth: 2,
  },
});
