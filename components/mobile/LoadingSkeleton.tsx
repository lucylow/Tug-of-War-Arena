import { memo } from "react";
import { StyleSheet, View } from "react-native";

import { ShimmerLoading } from "@/components/animations/ShimmerLoading";
import { COMPANION_RENDER_BUDGET } from "@/lib/mobile-ux";

export const MobileLoadingSkeleton = memo(function MobileLoadingSkeleton({
  rows = COMPANION_RENDER_BUDGET.skeletonCount,
  reduceMotion = false,
}: {
  rows?: number;
  reduceMotion?: boolean;
}) {
  const count = Math.max(1, Math.min(COMPANION_RENDER_BUDGET.skeletonCount, rows));
  return (
    <View accessibilityRole="progressbar" accessibilityLabel="Loading mobile content" style={styles.wrap}>
      <ShimmerLoading height={28} borderRadius={10} reduceMotion={reduceMotion} />
      {Array.from({ length: count }, (_, index) => (
        <ShimmerLoading key={index} height={16} borderRadius={8} style={styles.row} reduceMotion={reduceMotion} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 10, paddingVertical: 8 },
  row: { marginTop: 2 },
});
