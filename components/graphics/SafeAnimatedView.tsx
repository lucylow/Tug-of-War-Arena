import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { GraphicsErrorBoundary } from "@/components/errorBoundary/GraphicsErrorBoundary";

interface SafeAnimatedViewProps {
  children: ReactNode;
  fallback?: ReactNode;
  style?: StyleProp<ViewStyle>;
  componentName?: string;
  onError?: (error: Error) => void;
}

export function SafeAnimatedView({
  children,
  fallback,
  style,
  componentName = "SafeAnimatedView",
  onError,
}: SafeAnimatedViewProps) {
  return (
    <GraphicsErrorBoundary
      componentName={componentName}
      fallback={fallback ?? <View style={style} />}
      onError={(error) => onError?.(error)}
    >
      <View style={style}>{children}</View>
    </GraphicsErrorBoundary>
  );
}
