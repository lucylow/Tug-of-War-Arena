type LogLevel = "info" | "warn" | "error";

const SENSITIVE_KEY = /(private.?key|mnemonic|seed.?phrase|secret|password|token|authorization|signature)/i;

function redact(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[truncated]";
  if (typeof value === "string") {
    if (SENSITIVE_KEY.test(value) || /chrome-extension:\/\//i.test(value)) return "[redacted]";
    return value.length > 500 ? `${value.slice(0, 500)}…` : value;
  }
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.slice(0, 12).map((entry) => redact(entry, depth + 1));
  const output: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    output[key] = SENSITIVE_KEY.test(key) ? "[redacted]" : redact(entry, depth + 1);
  }
  return output;
}

function emit(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  const payload = context ? redact(context) : undefined;
  if (level === "error") {
    console.error(message, payload ?? "");
    return;
  }
  if (level === "warn") {
    console.warn(message, payload ?? "");
    return;
  }
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.info(message, payload ?? "");
  }
}

export const logger = {
  info(message: string, context?: Record<string, unknown>): void {
    emit("info", message, context);
  },
  warn(message: string, context?: Record<string, unknown>): void {
    emit("warn", message, context);
  },
  error(message: string, context?: Record<string, unknown>): void {
    emit("error", message, context);
  },
};

export function walletLogContext(input: {
  code?: string;
  runtime?: string;
  provider?: string;
  chain?: number | null;
  recoverable?: boolean;
}): Record<string, unknown> {
  return {
    code: input.code ?? "UNKNOWN",
    runtime: input.runtime ?? "unknown",
    provider: input.provider ?? "none",
    chain: input.chain ?? null,
    recoverable: Boolean(input.recoverable),
  };
}
