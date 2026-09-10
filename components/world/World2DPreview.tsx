import { StyleSheet, Text, View } from "react-native";

import { WorldMiniMap2D } from "@/components/world/WorldMiniMap2D";
import { WALLET_COLORS as C } from "@/components/wallet/palette";
import { DEMO_DISCLAIMER, createEmptyHybridWorldDataset, type HybridWorldDataset } from "@/lib/hybrid-world";

type Props = {
  dataset: HybridWorldDataset;
};

export function World2DPreview({ dataset }: Props) {
  return (
    <View accessibilityLabel="2D world map preview" style={styles.card}>
      <Text style={styles.kicker}>2D WORLD MAP</Text>
      <Text style={styles.title}>Projected from 3D spawn</Text>
      <Text style={styles.body}>Same coordinates as the Decentraland parcel — not a separate invented map.</Text>
      <View style={styles.mapWrap}>
        <WorldMiniMap2D dataset={dataset ?? createEmptyHybridWorldDataset()} />
      </View>
      <Text style={styles.disclaimer}>{DEMO_DISCLAIMER}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.panel,
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  kicker: { color: C.gold, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  title: { color: C.cloud, fontSize: 18, fontWeight: "900", marginTop: 6 },
  body: { color: C.fog, fontSize: 13, lineHeight: 18, marginTop: 6, marginBottom: 12 },
  mapWrap: { marginBottom: 10 },
  disclaimer: { color: C.fog, fontSize: 11, lineHeight: 15, fontWeight: "600" },
});
