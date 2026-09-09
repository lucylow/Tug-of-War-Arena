export function parseApiJsonBody<T>(text: string): T {
  if (!text.trim()) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("API returned an invalid JSON response");
  }
}

export function readApiErrorMessage(errorText: string, statusText: string): string {
  if (!errorText.trim()) return statusText ? `API call failed: ${statusText}` : "API call failed";
  try {
    const errorJson: unknown = JSON.parse(errorText);
    if (errorJson && typeof errorJson === "object") {
      const record = errorJson as Record<string, unknown>;
      if (typeof record.error === "string" && record.error.trim()) return record.error;
      if (typeof record.message === "string" && record.message.trim()) return record.message;
    }
  } catch {
    // Not JSON; keep the raw text when it is short enough to be useful.
  }
  return errorText.length > 300 ? "API call failed" : errorText;
}
