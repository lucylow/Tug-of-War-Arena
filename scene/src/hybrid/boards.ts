import type {
  WorldEventDemo,
  WorldRoomDemo,
  WorldScoreboardDemo,
  WorldSocialSignalDemo,
} from "./types";

const FALLBACK_SCOREBOARD: WorldScoreboardDemo = {
  roomId: "room_friday",
  sunScore: 428,
  moonScore: 381,
  ropePosition: 0.16,
  leadingTeam: "sun",
  sunCrewLabel: "SUN CREW",
  moonCrewLabel: "MOON CREW",
};

function asRooms(rooms: WorldRoomDemo[] | null | undefined): WorldRoomDemo[] {
  return Array.isArray(rooms) ? rooms.filter(Boolean) : [];
}

function asEvents(events: WorldEventDemo[] | null | undefined): WorldEventDemo[] {
  return Array.isArray(events) ? events.filter(Boolean) : [];
}

export function formatScoreboardText(scoreboard: WorldScoreboardDemo | null | undefined): string {
  const board = scoreboard && typeof scoreboard === "object" ? { ...FALLBACK_SCOREBOARD, ...scoreboard } : FALLBACK_SCOREBOARD;
  const ropePosition = Number.isFinite(Number(board.ropePosition)) ? Number(board.ropePosition) : 0;
  const rope = ropePosition >= 0 ? ">>>>>>>".slice(0, 3 + Math.round(ropePosition * 3)) : "<<<<<<<";
  return [
    `☀ ${board.sunCrewLabel || FALLBACK_SCOREBOARD.sunCrewLabel}     ${Number.isFinite(Number(board.sunScore)) ? board.sunScore : 0}`,
    "",
    "       ROPE",
    `      ${rope || "======="}`,
    "",
    `🌙 ${board.moonCrewLabel || FALLBACK_SCOREBOARD.moonCrewLabel}    ${Number.isFinite(Number(board.moonScore)) ? board.moonScore : 0}`,
  ].join("\n");
}

export function formatRoomDiscoveryBoard(rooms: WorldRoomDemo[] | null | undefined): string {
  const list = asRooms(rooms);
  const lines =
    list.length === 0
      ? ["1. Friday Night Pull", "   731XZ · ACTIVE · mock data"]
      : list.slice(0, 5).map((room, index) => {
          const occupancy = `${Array.isArray(room.playerIds) ? room.playerIds.length : 0}/${room.maxPlayers || 8}`;
          const phase = typeof room.phase === "string" ? room.phase.toUpperCase() : "WAITING";
          return `${index + 1}. ${room.title || "Public room"}\n   ${room.code || "DEMO"} · ${phase} · ${occupancy}`;
        });
  return ["ROOM DISCOVERY", "--------------", ...lines].join("\n");
}

export function formatEventBoard(events: WorldEventDemo[] | null | undefined): string {
  const list = asEvents(events);
  const lines =
    list.length === 0
      ? ["Friendzone Friday", "DAILY · mock data"]
      : list.slice(0, 6).map((event) => {
          const kind = event.kind === "social" ? "DAILY" : event.kind === "match" ? "CREW" : String(event.kind || "EVENT").toUpperCase();
          const startsIn = Number.isFinite(Number(event.startsInMinutes)) ? event.startsInMinutes : 0;
          const participants = Number.isFinite(Number(event.participants)) ? event.participants : 0;
          return `${event.title || "Upcoming event"}\n${kind} · ${startsIn}m · ${participants} players`;
        });
  return ["UPCOMING EVENTS", "---------------", ...lines].join("\n");
}

export function formatSocialSignalLine(signal: WorldSocialSignalDemo | null | undefined, now = Date.now()): string {
  if (!signal) return "✨ Arena is quiet\njust now";
  const createdAt = Number.isFinite(Number(signal.createdAt)) ? Number(signal.createdAt) : now;
  const ageMinutes = Math.max(0, Math.round((now - createdAt) / 60000));
  return `${signal.emoji || "✨"} ${signal.message || "Someone cheered"}\n${ageMinutes}m ago`;
}

export function formatRoomHud(room: WorldRoomDemo | null | undefined): string {
  if (!room) {
    return "Friday Night Pull\n731XZ\nSUN 428   ROPE 16   MOON 381\nmock data · ACTIVE";
  }
  const occupancy = `${Array.isArray(room.playerIds) ? room.playerIds.length : 0}/${room.maxPlayers || 8} players`;
  const rope = Number.isFinite(Number(room.ropePosition)) ? Math.round(Number(room.ropePosition) * 100) : 0;
  const sun = Number.isFinite(Number(room.sunScore)) ? room.sunScore : 0;
  const moon = Number.isFinite(Number(room.moonScore)) ? room.moonScore : 0;
  const phase = typeof room.phase === "string" ? room.phase.toUpperCase() : "WAITING";
  return `${room.title || "Public room"}\n${room.code || "DEMO"}\nSUN ${sun}   ROPE ${rope}   MOON ${moon}\n${occupancy} · ${phase}`;
}
