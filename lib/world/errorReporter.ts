const SENSITIVE = ["privateKey", "mnemonic", "seed", "secret", "private_key", "rawCredentials"];

function strip(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(strip);
  const out: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE.some((item) => key.toLowerCase().includes(item.toLowerCase()))) continue;
    out[key] = strip(nested);
  }
  return out;
}

export const ErrorReporter = {
  capture(error: unknown, context?: Record<string, unknown>): void {
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.warn("[friendzone]", strip(error), strip(context ?? {}));
    }
  },
  captureWalletError(error: unknown): void {
    this.capture(error, { domain: "wallet" });
  },
  captureNetworkError(error: unknown): void {
    this.capture(error, { domain: "network" });
  },
  captureWorldError(error: unknown): void {
    this.capture(error, { domain: "world" });
  },
};
