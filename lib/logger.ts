export type LogLevel = "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  message: string;
  details?: unknown;
  timestamp: number;
}

const MAX_ENTRIES = 200;

let enabled = true;
const entries: LogEntry[] = [];

function push(level: LogLevel, message: string, details?: unknown): void {
  const entry: LogEntry = { level, message, details, timestamp: Date.now() };
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) entries.shift();
  if (!enabled) return;
  if (level === "error") {
    console.error(message, details ?? "");
  } else if (level === "warn") {
    console.warn(message, details ?? "");
  } else if (typeof __DEV__ === "undefined" || __DEV__) {
    console.info(message, details ?? "");
  }
}

export const Logger = {
  info(message: string, details?: unknown) {
    push("info", message, details);
  },
  warn(message: string, details?: unknown) {
    push("warn", message, details);
  },
  error(message: string, details?: unknown) {
    push("error", message, details);
  },
  getEntries(): readonly LogEntry[] {
    return entries;
  },
  clear() {
    entries.length = 0;
  },
  setEnabled(value: boolean) {
    enabled = value;
  },
};
