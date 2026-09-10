import { logger } from "@/lib/logging/logger";

export async function runSafely<T>(work: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await work();
  } catch (error) {
    logger.warn("Safe async failed", { error: error instanceof Error ? error.message : "unknown" });
    return fallback;
  }
}

export async function safeAsync<T>(work: () => Promise<T>, fallback: T, context = "async"): Promise<T> {
  return runSafely(work, fallback);
}
