import { normalizeProviderError, shouldRetryWalletError, type NormalizedWalletError } from "./providerErrors";

export async function withWalletRetry<T>(task: () => Promise<T>): Promise<T> {
  try {
    return await task();
  } catch (error) {
    const kind: NormalizedWalletError = normalizeProviderError(error);
    if (kind === "USER_REJECTED") throw error;
    if (!shouldRetryWalletError(kind)) throw error;
    await new Promise((resolve) => setTimeout(resolve, 400));
    try {
      return await task();
    } catch (retryError) {
      throw retryError;
    }
  }
}
