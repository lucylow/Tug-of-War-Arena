export type OAuthCallbackOutcome =
  | { kind: "error"; message: string }
  | { kind: "session-token"; sessionToken: string }
  | { kind: "exchange"; code: string; state: string }
  | { kind: "missing-parameters"; message: "Missing code or state parameter" };

export function resolveOAuthCallbackOutcome(input: {
  error?: string | null;
  sessionToken?: string | null;
  code?: string | null;
  state?: string | null;
}): OAuthCallbackOutcome {
  if (input.error) return { kind: "error", message: input.error };
  if (input.sessionToken) return { kind: "session-token", sessionToken: input.sessionToken };
  if (!input.code || !input.state) {
    return { kind: "missing-parameters", message: "Missing code or state parameter" };
  }
  return { kind: "exchange", code: input.code, state: input.state };
}
