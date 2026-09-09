import type { MockUser } from "@/lib/mock/generators/users";

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl: string;
  wins: number;
  losses: number;
  winRatio: number;
  reputation: number;
  level: number;
  rank: number;
}

export function generateLeaderboard(users: MockUser[]): LeaderboardEntry[] {
  return users
    .map((user) => ({
      userId: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      wins: user.wins,
      losses: user.losses,
      winRatio: user.matchesPlayed > 0 ? user.wins / user.matchesPlayed : 0,
      reputation: user.reputation,
      level: user.level,
      rank: 0,
    }))
    .sort((a, b) => b.wins - a.wins || b.winRatio - a.winRatio)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}
