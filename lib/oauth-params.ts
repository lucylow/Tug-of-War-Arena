export type OAuthFallbackParams = {
  code?: string;
  state?: string;
  sessionToken?: string;
};

const SUPPORTED_KEYS = new Set<keyof OAuthFallbackParams>(["code", "state", "sessionToken"]);

export function readOAuthErrorParam(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url, "http://dummy").searchParams.get("error");
  } catch {
    return null;
  }
}

export function parseOAuthFallbackParams(url: string): OAuthFallbackParams {
  const result: OAuthFallbackParams = {};
  const match = url.match(/[?&](code|state|sessionToken)=([^&]+)/g);
  if (!match) return result;

  match.forEach((param) => {
    const [rawKey, rawValue] = param.substring(1).split("=");
    if (!rawKey || rawValue === undefined || !SUPPORTED_KEYS.has(rawKey as keyof OAuthFallbackParams)) return;

    try {
      const key = rawKey as keyof OAuthFallbackParams;
      result[key] = decodeURIComponent(rawValue);
    } catch {
      // Ignore malformed percent-encoding and let the caller continue safely.
    }
  });

  return result;
}
