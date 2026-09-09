import React, { type ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { FallbackGraphics } from "@/components/fallback/FallbackGraphics";
import { GraphicsErrorBoundary } from "@/components/errorBoundary/GraphicsErrorBoundary";
import { SafeReanimatedView } from "@/components/graphics/SafeReanimatedView";
import { SafeSkiaCanvas } from "@/components/graphics/SafeSkiaCanvas";
import { useGraphicsErrorHandler } from "@/hooks/useGraphicsErrorHandler";
import { useGraphicsQualityManager } from "@/hooks/useGraphicsQualityManager";

export interface SafeGameScreenProps {
  children?: ReactNode;
  canvas?: ReactNode;
  hud?: ReactNode;
  footer?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Wraps a match surface so Skia/SVG, Reanimated HUD, and power bars
 * fail independently instead of taking down the whole arena screen.
 */
export const SafeGameScreen: React.FC<SafeGameScreenProps> = ({ children, canvas, hud, footer, style }) => {
  const { handleError, clearError } = useGraphicsErrorHandler("GameScreen");
  useGraphicsQualityManager();

  const handleRetry = () => {
    clearError();
  };

  return (
    <GraphicsErrorBoundary
      componentName="GameScreen"
      fallback={<FallbackGraphics onRetry={handleRetry} />}
      onError={(error, info) => handleError({ type: "render", message: error.message, details: info })}
    >
      <View style={[styles.container, style]}>
        {hud ? (
          <SafeReanimatedView fallbackComponent={<View style={styles.placeholder} />}>{hud}</SafeReanimatedView>
        ) : null}

        {canvas ? (
          <SafeSkiaCanvas
            style={styles.canvas}
            fallbackComponent={<View style={styles.placeholder} />}
            onError={(err) => handleError({ type: "render", message: err.message, details: err })}
          >
            {canvas}
          </SafeSkiaCanvas>
        ) : null}

        {children}

        {footer}
      </View>
    </GraphicsErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  canvas: { flex: 1 },
  placeholder: { minHeight: 48, backgroundColor: "rgba(0,0,0,0.5)" },
});
