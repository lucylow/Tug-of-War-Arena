import { ethers } from "ethers";

import type { ArenaMatchView, ArenaPlayerStats, ArenaPlayerView } from "@/lib/web3/types";

const MATCH_STATUS = ["Waiting", "Active", "Finished"] as const;
const MATCH_TEAM = ["Sun", "Moon"] as const;

export function formatTokenAmount(value: unknown): string {
  try {
    return ethers.formatEther(value as ethers.BigNumberish);
  } catch {
    return "0";
  }
}

export function decodeMatchView(data: unknown): ArenaMatchView {
  if (!Array.isArray(data) || data.length < 9) {
    throw new Error("Invalid match payload");
  }

  const players = Array.isArray(data[1])
    ? data[1].filter((item): item is string => typeof item === "string")
    : [];

  return {
    id: String(data[0] ?? ""),
    players,
    startTime: String(data[2] ?? "0"),
    endTime: String(data[3] ?? "0"),
    status: Number(data[4] ?? 0),
    winner: Number(data[5] ?? 0),
    prizePool: formatTokenAmount(data[6]),
    sunPower: String(data[7] ?? "0"),
    moonPower: String(data[8] ?? "0"),
  };
}

export function formatMatchStatus(status: number): string {
  return MATCH_STATUS[status] ?? "Unknown";
}

export function formatMatchTeam(team: number): string {
  return MATCH_TEAM[team] ?? "Unknown";
}

export function decodePlayerInMatch(data: unknown): ArenaPlayerView {
  if (Array.isArray(data) && data.length >= 5) {
    return {
      wallet: String(data[0] ?? ""),
      displayName: String(data[1] ?? ""),
      team: Number(data[2] ?? 0),
      power: String(data[3] ?? "0"),
      isReady: Boolean(data[4]),
    };
  }
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if ("wallet" in record || "displayName" in record) {
      return {
        wallet: String(record.wallet ?? ""),
        displayName: String(record.displayName ?? ""),
        team: Number(record.team ?? 0),
        power: String(record.power ?? "0"),
        isReady: Boolean(record.isReady),
      };
    }
  }
  throw new Error("Invalid player payload");
}

export function decodePlayerStats(elo: unknown, player?: ArenaPlayerView | null): ArenaPlayerStats {
  return {
    elo: String(elo ?? "0"),
    displayName: player?.displayName ?? "",
    team: player?.team ?? 0,
    power: player?.power ?? "0",
    isReady: player?.isReady ?? false,
  };
}
