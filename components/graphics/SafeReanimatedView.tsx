import React, { useEffect, useState, type ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated from "react-native-reanimated";

import { GraphicsErrorBoundary } from "@/components/errorBoundary/GraphicsErrorBoundary";

export interface SafeReanimatedViewProps {
  children: ReactNode;
  fallbackComponent?: ReactNode;
  onError?: (error: Error) => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Isolates Reanimated crashes so HUD / overlay motion can fall back to a static view.
 */
export const SafeReanimatedView: React.FC<SafeReanimatedViewProps> = ({
  children,
  fallbackComponent,
  onError,
  style,
}) => {
  const [hasError, setHasError] = useState(false);

  const handleError = (error: Error) => {
    setHasError(true);
    onError?.(error);
  };

  useEffect(() => {
    if (!hasError) return;
    const timer = setTimeout(() => setHasError(false), 2000);
    return () => clearTimeout(timer);
  }, [hasError]);

  if (hasError) {
    return fallbackComponent ? <>{fallbackComponent}</> : <View style={styles.placeholder} />;
  }

  return (
    <GraphicsErrorBoundary componentName="ReanimatedView" onError={handleError} fallback={fallbackComponent}>
      <Animated.View style={style}>{children}</Animated.View>
    </GraphicsErrorBoundary>
  );
};

const styles = StyleSheet.create({
  placeholder: { backgroundColor: "transparent" },
});
