import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ARENA_COLORS, SPACING, TYPOGRAPHY } from "@/lib/animations";
import {
  graphicsErrorCopy,
  initialGraphicsRecoveryState,
  reduceGraphicsRecovery,
  type GraphicsRecoveryState,
} from "@/lib/graphics";
import { ErrorReportingService } from "@/lib/graphics/ErrorReportingService";
import { Logger } from "@/lib/logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  componentName?: string;
}

interface State extends GraphicsRecoveryState {
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error boundary for graphics-heavy surfaces (Skia/SVG canvases, Reanimated, 3D-style venue).
 * Isolates a render crash so the rest of the match stays playable.
 */
export class GraphicsErrorBoundary extends Component<Props, State> {
  state: State = { ...initialGraphicsRecoveryState, error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      ...reduceGraphicsRecovery(initialGraphicsRecoveryState, {
        type: "capture",
        message: error.message,
      }),
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    const name = this.props.componentName || "unknown component";
    Logger.error(`Graphics error in ${name}`, { error, errorInfo });
    ErrorReportingService.getInstance().reportGraphicsError(name, error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({
      ...reduceGraphicsRecovery(this.state, { type: "reset" }),
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container} accessibilityLabel={graphicsErrorCopy.accessibilityLabel}>
          <Text style={styles.icon}>{graphicsErrorCopy.icon}</Text>
          <Text style={styles.title}>{graphicsErrorCopy.title}</Text>
          <Text style={styles.message}>
            {this.state.error?.message || this.state.message || graphicsErrorCopy.defaultMessage}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={graphicsErrorCopy.buttonLabel}
            accessibilityHint={graphicsErrorCopy.buttonHint}
            onPress={this.resetError}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          >
            <Text style={styles.buttonText}>{graphicsErrorCopy.buttonLabel}</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.lg,
    backgroundColor: ARENA_COLORS.ink,
    minHeight: 160,
  },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { ...TYPOGRAPHY.h2, color: ARENA_COLORS.cloud, marginBottom: 8 },
  message: {
    ...TYPOGRAPHY.body,
    color: ARENA_COLORS.fog,
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: ARENA_COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: "center",
  },
  buttonText: { ...TYPOGRAPHY.button, color: ARENA_COLORS.ink },
  pressed: { opacity: 0.8 },
});
