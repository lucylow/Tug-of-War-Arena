import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { MOBILE_COPY } from "@/shared/copy";
import { WALLET_COLORS as C } from "@/components/wallet/palette";

type Props = {
  children: ReactNode;
  surface: string;
  onReturnToCrew?: () => void;
};

type State = { hasError: boolean };

export class SurfaceErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) console.warn(`[${this.props.surface}]`, error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={styles.wrap} accessibilityLabel={`${this.props.surface} recovery`}>
        <Text style={styles.title}>{MOBILE_COPY.somethingWentWrong}</Text>
        <Pressable
          accessibilityRole="button"
          hitSlop={12}
          onPress={() => this.setState({ hasError: false })}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>{MOBILE_COPY.tryAgain}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          hitSlop={12}
          onPress={this.props.onReturnToCrew}
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryText}>{MOBILE_COPY.returnToCrew}</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrap: { padding: 20, alignItems: "center" },
  title: { color: C.cloud, fontSize: 18, fontWeight: "900", marginBottom: 12 },
  button: { minHeight: 44, minWidth: 160, borderRadius: 14, backgroundColor: C.gold, alignItems: "center", justifyContent: "center" },
  buttonText: { color: C.ink, fontWeight: "900" },
  secondary: { minHeight: 44, marginTop: 8, justifyContent: "center" },
  secondaryText: { color: C.mint, fontWeight: "900" },
  pressed: { opacity: 0.8 },
});
