export interface WorldInvite {
  scheme: "friendzone" | "https";
  roomCode: string;
  href: string;
}

const ROOM_CODE = /^[A-Z0-9]{5}$/;

export function createWorldInvite(roomCode: string, httpsBase?: string | null): WorldInvite | null {
  const code = String(roomCode ?? "").trim().toUpperCase();
  if (!ROOM_CODE.test(code)) return null;
  const base = httpsBase?.trim();
  if (base) {
    try {
      const url = new URL(base);
      if (url.protocol !== "https:") return null;
      url.searchParams.set("room", code);
      return { scheme: "https", roomCode: code, href: url.toString() };
    } catch {
      return null;
    }
  }
  return { scheme: "friendzone", roomCode: code, href: `friendzone://world?room=${code}` };
}

export function parseWorldInvite(raw: string | null | undefined): WorldInvite | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const value = raw.trim();
  try {
    if (value.startsWith("friendzone://")) {
      const url = new URL(value);
      const room = url.searchParams.get("room")?.toUpperCase() ?? "";
      if (!ROOM_CODE.test(room)) return null;
      return { scheme: "friendzone", roomCode: room, href: `friendzone://world?room=${room}` };
    }
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    const room = (url.searchParams.get("room") ?? "").toUpperCase();
    if (!ROOM_CODE.test(room)) return null;
    return { scheme: "https", roomCode: room, href: url.toString() };
  } catch {
    return null;
  }
}
