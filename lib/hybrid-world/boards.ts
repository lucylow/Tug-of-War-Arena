import type {
  WorldEventDemo,
  WorldRoomDemo,
  WorldScoreboardDemo,
  WorldSocialSignalDemo,
} from "./types";

export function formatScoreboardText(scoreboard: WorldScoreboardDemo): string {
  const rope = scoreboard.ropePosition >= 0 ? ">>>>>>>".slice(0, 3 + Math.round(scoreboard.ropePosition * 3)) : "<<<<<<<";
  return [
    `☀ ${scoreboard.sunCrewLabel}     ${scoreboard.sunScore}`,
    "",
    "       ROPE",
    `      ${rope || "======="}`,
    "",
    `🌙 ${scoreboard.moonCrewLabel}    ${scoreboard.moonScore}`,
  ].join("\n");
}

export function formatRoomDiscoveryBoard(rooms: WorldRoomDemo[]): string {
  const lines = rooms.slice(0, 5).map((room, index) => {
    const occupancy = `${room.playerIds.length}/${room.maxPlayers}`;
    return `${index + 1}. ${room.title}\n   ${room.code} · ${room.phase.toUpperCase()} · ${occupancy}`;
  });
  return ["ROOM DISCOVERY", "--------------", ...lines].join("\n");
}

export function formatEventBoard(events: WorldEventDemo[]): string {
  const lines = events.slice(0, 6).map((event) => {
    const kind = event.kind === "social" ? "DAILY" : event.kind === "match" ? "CREW" : event.kind.toUpperCase();
    return `${event.title}\n${kind} · ${event.startsInMinutes}m · ${event.participants} players`;
  });
  return ["UPCOMING EVENTS", "---------------", ...lines].join("\n");
}

export function formatSocialSignalLine(signal: WorldSocialSignalDemo, now = Date.now()): string {
  const ageMinutes = Math.max(0, Math.round((now - signal.createdAt) / 60000));
  return `${signal.emoji} ${signal.message}\n${ageMinutes}m ago`;
}

export function formatRoomHud(room: WorldRoomDemo): string {
  const occupancy = `${room.playerIds.length}/${room.maxPlayers} players`;
  return `${room.title}\n${room.code}\nSUN ${room.sunScore}   ROPE ${Math.round(room.ropePosition * 100)}   MOON ${room.moonScore}\n${occupancy} · ${room.phase.toUpperCase()}`;
}
