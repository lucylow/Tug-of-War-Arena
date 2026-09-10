export type FriendzoneDeepLink =
  | { kind: "room"; code: string }
  | { kind: "world" }
  | { kind: "match"; matchId: string }
  | { kind: "governance" };

const ALLOWED_SCHEMES = new Set(["https:", "friendzone:", "decentraland:", "metamask:"]);

export function parseFriendzoneDeepLink(raw: string | null | undefined): FriendzoneDeepLink | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const trimmed = raw.trim();
  if (!/^friendzone:/i.test(trimmed)) return null;
  const path = trimmed.replace(/^friendzone:\/\//i, "").replace(/^friendzone:/i, "");
  const [kind, ...rest] = path.split("/").filter(Boolean);
  if (kind === "world") return { kind: "world" };
  if (kind === "governance") return { kind: "governance" };
  if (kind === "room" && rest[0]) return { kind: "room", code: rest[0] };
  if (kind === "match" && rest[0]) return { kind: "match", matchId: rest[0] };
  return null;
}

export function isSafeExternalUrl(raw: string | null | undefined): boolean {
  if (typeof raw !== "string" || !raw.trim()) return false;
  try {
    const url = new URL(raw.trim());
    if (!ALLOWED_SCHEMES.has(url.protocol)) return false;
    if (url.protocol === "https:") return Boolean(url.hostname);
    return true;
  } catch {
    return false;
  }
}
