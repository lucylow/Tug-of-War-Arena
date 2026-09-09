import { MultiplayerEmitter } from "@/lib/multiplayer/emitter";
import { getPlayerAvatar, getPlayerName } from "@/lib/multiplayer/identity";
import { readMultiplayerJson, writeMultiplayerJson } from "@/lib/multiplayer/storage";
import { SeededRandom } from "@/lib/mock/seed";
import type { LeaderboardEntry, LeaderboardFilter } from "@/lib/multiplayer/types";

export class LeaderboardService extends MultiplayerEmitter {
  private static instance: LeaderboardService | undefined;
  private leaderboard: LeaderboardEntry[] = [];
  private friendsList: string[] = [];
  private lastUpdate = 0;
  private loaded = false;

  static getInstance(): LeaderboardService {
    if (!LeaderboardService.instance) LeaderboardService.instance = new LeaderboardService();
    return LeaderboardService.instance;
  }

  static resetInstance(): void {
    LeaderboardService.instance?.dispose();
    LeaderboardService.instance = undefined;
  }

  async fetchLeaderboard(filter: LeaderboardFilter = { type: "global" }): Promise<LeaderboardEntry[]> {
    await this.ensureLoaded();
    if (this.leaderboard.length === 0) {
      this.leaderboard = generateMockLeaderboard(filter.limit ?? 24);
    }
    this.sortLeaderboard();
    this.lastUpdate = Date.now();
    const entries = this.applyFilter(filter);
    this.emit("leaderboard-updated", entries);
    return entries;
  }

  getLeaderboard(): LeaderboardEntry[] {
    return this.leaderboard;
  }

  getPlayerRank(playerId: string): number | null {
    return this.leaderboard.find((entry) => entry.playerId === playerId)?.rank ?? null;
  }

  getPlayerStats(playerId: string): LeaderboardEntry | null {
    return this.leaderboard.find((entry) => entry.playerId === playerId) ?? null;
  }

  getLastUpdate(): number {
    return this.lastUpdate;
  }

  async updatePlayerStats(playerId: string, won: boolean, xpGain: number): Promise<LeaderboardEntry> {
    await this.ensureLoaded();
    let entry = this.leaderboard.find((item) => item.playerId === playerId);
    if (!entry) {
      entry = {
        playerId,
        playerName: await getPlayerName(),
        avatar: getPlayerAvatar(playerId),
        wins: 0,
        losses: 0,
        winRatio: 0,
        elo: 1200,
        streak: 0,
        bestStreak: 0,
        rank: 0,
        level: 1,
        xp: 0,
      };
      this.leaderboard.push(entry);
    }
    if (won) {
      entry.wins += 1;
      entry.streak += 1;
      entry.bestStreak = Math.max(entry.bestStreak, entry.streak);
      entry.elo += 20;
    } else {
      entry.losses += 1;
      entry.streak = 0;
      entry.elo = Math.max(800, entry.elo - 20);
    }
    const played = entry.wins + entry.losses;
    entry.winRatio = played > 0 ? entry.wins / played : 0;
    entry.xp += xpGain;
    entry.level = Math.floor(entry.xp / 100) + 1;
    this.sortLeaderboard();
    await writeMultiplayerJson("tug-of-war-leaderboard-state", this.leaderboard);
    this.emit("stats-updated", playerId);
    return entry;
  }

  async addFriend(friendId: string): Promise<void> {
    await this.ensureLoaded();
    if (this.friendsList.includes(friendId)) return;
    this.friendsList.push(friendId);
    await writeMultiplayerJson("tug-of-war-friends-list", this.friendsList);
    this.emit("friend-added", friendId);
  }

  async removeFriend(friendId: string): Promise<void> {
    await this.ensureLoaded();
    this.friendsList = this.friendsList.filter((id) => id !== friendId);
    await writeMultiplayerJson("tug-of-war-friends-list", this.friendsList);
    this.emit("friend-removed", friendId);
  }

  getFriends(): string[] {
    return this.friendsList;
  }

  dispose(): void {
    this.leaderboard = [];
    this.friendsList = [];
    this.loaded = false;
    this.removeAllListeners();
  }

  private applyFilter(filter: LeaderboardFilter): LeaderboardEntry[] {
    const limit = filter.limit ?? this.leaderboard.length;
    if (filter.type === "friends") {
      return this.leaderboard.filter((entry) => this.friendsList.includes(entry.playerId)).slice(0, limit);
    }
    return this.leaderboard.slice(0, limit);
  }

  private sortLeaderboard(): void {
    this.leaderboard.sort((a, b) => {
      if (a.elo !== b.elo) return b.elo - a.elo;
      if (a.winRatio !== b.winRatio) return b.winRatio - a.winRatio;
      return b.wins - a.wins;
    });
    this.leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    this.loaded = true;
    this.friendsList = (await readMultiplayerJson<string[]>("tug-of-war-friends-list")) ?? [];
    this.leaderboard = (await readMultiplayerJson<LeaderboardEntry[]>("tug-of-war-leaderboard-state")) ?? [];
  }
}

function generateMockLeaderboard(count: number): LeaderboardEntry[] {
  const random = new SeededRandom(42);
  const names = ["Alex", "Jordan", "Taylor", "Morgan", "Sam", "Chris", "Pat", "Jamie", "Drew", "Casey"];
  const entries: LeaderboardEntry[] = [];
  for (let i = 0; i < count; i += 1) {
    const wins = random.nextInt(4, 80);
    const losses = random.nextInt(1, 40);
    const total = wins + losses;
    entries.push({
      playerId: `player_${i}`,
      playerName: names[i % names.length] ?? `Player ${i}`,
      avatar: getPlayerAvatar(String(i + 1)),
      wins,
      losses,
      winRatio: total > 0 ? wins / total : 0,
      elo: 1000 + random.nextInt(0, 500),
      streak: random.nextInt(0, 8),
      bestStreak: random.nextInt(2, 14),
      rank: 0,
      level: random.nextInt(1, 20),
      xp: random.nextInt(20, 1800),
    });
  }
  return entries;
}
