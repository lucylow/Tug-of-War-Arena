export type OAuthCallbackOutcome =
  | { kind: "error"; message: string }
  | { kind: "session-token"; sessionToken: string }
  | { kind: "exchange"; code: string; state: string }
  | { kind: "missing-parameters"; message: "Missing code or state parameter" };

function readPresentValue(value?: string | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function resolveOAuthCallbackOutcome(input: {
  error?: string | null;
  sessionToken?: string | null;
  code?: string | null;
  state?: string | null;
}): OAuthCallbackOutcome {
  const error = readPresentValue(input.error);
  if (error) return { kind: "error", message: error };

  const sessionToken = readPresentValue(input.sessionToken);
  if (sessionToken) return { kind: "session-token", sessionToken };

  const code = readPresentValue(input.code);
  const state = readPresentValue(input.state);
  if (!code || !state) {
    return { kind: "missing-parameters", message: "Missing code or state parameter" };
  }
  return { kind: "exchange", code, state };
}
