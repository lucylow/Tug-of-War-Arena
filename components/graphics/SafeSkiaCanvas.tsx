import React, { useEffect, useState, type ReactNode } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { GraphicsErrorBoundary } from "@/components/errorBoundary/GraphicsErrorBoundary";
import { ARENA_COLORS } from "@/lib/animations";
import { graphicsErrorCopy } from "@/lib/graphics";

export interface SafeSkiaCanvasProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  fallbackComponent?: ReactNode;
  onError?: (error: Error) => void;
}

/**
 * Safe drawing surface for Skia/SVG/canvas graphics.
 * The companion currently draws with react-native-svg; this wrapper is the
 * hook point for `@shopify/react-native-skia` without making Skia a hard dep.
 */
export const SafeSkiaCanvas: React.FC<SafeSkiaCanvasProps> = ({
  children,
  fallbackComponent,
  onError,
  style,
}) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleError = (err: Error) => {
    setHasError(true);
    setError(err);
    onError?.(err);
  };

  useEffect(() => {
    if (!hasError) return;
    const timer = setTimeout(() => {
      setHasError(false);
      setError(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [hasError]);

  if (hasError) {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>;
    }
    return (
      <View style={[styles.fallback, style]}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.message}>{graphicsErrorCopy.unavailable}</Text>
        <Text style={styles.detail}>{error?.message || graphicsErrorCopy.skiaDetail}</Text>
      </View>
    );
  }

  return (
    <GraphicsErrorBoundary componentName="SkiaCanvas" onError={handleError} fallback={fallbackComponent}>
      <View style={style}>{children}</View>
    </GraphicsErrorBoundary>
  );
};

const styles = StyleSheet.create({
  fallback: {
    minHeight: 80,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: ARENA_COLORS.ink,
    padding: 16,
  },
  icon: { fontSize: 32, marginBottom: 8 },
  message: { fontSize: 18, color: ARENA_COLORS.cloud, fontWeight: "bold" },
  detail: { fontSize: 14, color: ARENA_COLORS.fog, marginTop: 4 },
});
