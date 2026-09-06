import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  errorRecoveryCopy,
  initialErrorRecoveryState,
  reduceErrorRecovery,
} from "@/lib/error-recovery";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = initialErrorRecoveryState;

  static getDerivedStateFromError(): State {
    return reduceErrorRecovery(initialErrorRecoveryState, { type: "capture" });
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) {
      console.error("Tug of War Arena render error", error, info.componentStack);
    }
  }

  reset = () => {
    this.setState((state) => reduceErrorRecovery(state, { type: "reset" }));
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.container} accessibilityLabel={errorRecoveryCopy.accessibilityLabel}>
        <Text style={styles.kicker}>{errorRecoveryCopy.kicker}</Text>
        <Text style={styles.title}>{errorRecoveryCopy.title}</Text>
        <Text style={styles.body}>{errorRecoveryCopy.body}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={errorRecoveryCopy.buttonLabel}
          accessibilityHint={errorRecoveryCopy.buttonHint}
          onPress={this.reset}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>{errorRecoveryCopy.buttonText}</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    backgroundColor: "#F4F6FF",
  },
  kicker: { color: "#E3A928", fontSize: 11, fontWeight: "900", letterSpacing: 1.6 },
  title: { color: "#171A4A", fontSize: 28, fontWeight: "900", textAlign: "center", marginTop: 10 },
  body: { color: "#65709B", fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 10, maxWidth: 300 },
  button: { minHeight: 54, borderRadius: 17, paddingHorizontal: 20, alignItems: "center", justifyContent: "center", backgroundColor: "#FFC857", marginTop: 24 },
  buttonText: { color: "#171A4A", fontSize: 12, fontWeight: "900", letterSpacing: 0.8 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
});
