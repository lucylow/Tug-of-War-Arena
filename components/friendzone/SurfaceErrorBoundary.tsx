import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { View } from "react-native";

import { ErrorRecoveryCard } from "@/components/common/ErrorRecoveryCard";
import { toUserMessage } from "@/lib/errors/appError";
import { ErrorReporter } from "@/lib/world/errorReporter";
import { MOBILE_COPY } from "@/shared/copy";

type Props = {
  children: ReactNode;
  surface: string;
  onReturnToCrew?: () => void;
};

type State = { hasError: boolean; message: string };

export class SurfaceErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: toUserMessage(error) };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    ErrorReporter.capture(error, { domain: this.props.surface, stack: info.componentStack });
  }

  reset = () => {
    this.setState({ hasError: false, message: "" });
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View accessibilityLabel={`${this.props.surface} recovery`}>
        <ErrorRecoveryCard
          title={this.props.surface}
          message={this.state.message || MOBILE_COPY.somethingWentWrong}
          retry={this.reset}
          secondaryAction={
            this.props.onReturnToCrew
              ? {
                  label: MOBILE_COPY.returnToCrew,
                  onPress: () => {
                    this.reset();
                    this.props.onReturnToCrew?.();
                  },
                }
              : undefined
          }
        />
      </View>
    );
  }
}
