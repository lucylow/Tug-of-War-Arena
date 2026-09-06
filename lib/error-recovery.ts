export type ErrorRecoveryState = { hasError: boolean };
export type ErrorRecoveryAction = { type: "capture" } | { type: "reset" };

export function reduceErrorRecovery(
  state: ErrorRecoveryState,
  action: ErrorRecoveryAction,
): ErrorRecoveryState {
  if (action.type === "capture") return { hasError: true };
  return { hasError: false };
}

export const initialErrorRecoveryState: ErrorRecoveryState = { hasError: false };

export const errorRecoveryCopy = {
  accessibilityLabel: "Tug of War Arena error recovery",
  kicker: "ARENA RECOVERY",
  title: "The rope took a timeout.",
  body: "Your local match is safe. Return to the arena home and try the demo again.",
  buttonLabel: "Return to Arena Home",
  buttonHint: "Dismisses the error and reloads the app content",
  buttonText: "RETURN TO ARENA HOME",
} as const;
