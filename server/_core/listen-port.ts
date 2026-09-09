const DEFAULT_PORT = 3000;

export function parsePreferredPort(value: string | undefined, fallback = DEFAULT_PORT): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) return fallback;
  return parsed;
}
