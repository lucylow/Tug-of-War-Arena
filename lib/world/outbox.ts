export type OutboxKind = "reaction" | "presence" | "match_result" | "mission_progress" | "achievement_proof" | "match_proof";

export type OutboxVisualState = "syncing" | "synced" | "offline_queued" | "error";

export interface OutboxEntry {
  id: string;
  kind: OutboxKind;
  payload: Record<string, unknown>;
  createdAt: number;
  attempts: number;
  irreversible: boolean;
}

const FINANCIAL = new Set(["transaction", "transfer", "vote", "sign"]);

export class AchievementOutbox {
  private entries: OutboxEntry[] = [];

  enqueue(kind: OutboxKind, payload: Record<string, unknown>, irreversible = false): OutboxEntry | null {
    if (irreversible) return null;
    for (const key of Object.keys(payload)) {
      if (FINANCIAL.has(key.toLowerCase())) return null;
    }
    const entry: OutboxEntry = {
      id: `out_${Math.random().toString(36).slice(2, 10)}`,
      kind,
      payload,
      createdAt: Date.now(),
      attempts: 0,
      irreversible: false,
    };
    this.entries.push(entry);
    return entry;
  }

  peek(): OutboxEntry[] {
    return [...this.entries];
  }

  clearSuccessful(ids: string[]): void {
    this.entries = this.entries.filter((entry) => !ids.includes(entry.id));
  }

  visualState(online: boolean, error = false): OutboxVisualState {
    if (error) return "error";
    if (!online && this.entries.length > 0) return "offline_queued";
    if (this.entries.length > 0) return "syncing";
    return "synced";
  }

  reset(): void {
    this.entries = [];
  }
}

let outbox: AchievementOutbox | null = null;

export function getAchievementOutbox(): AchievementOutbox {
  if (!outbox) outbox = new AchievementOutbox();
  return outbox;
}
