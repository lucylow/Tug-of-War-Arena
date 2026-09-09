import { getClock } from "@/lib/multiplayer/clock";
import { MultiplayerEmitter } from "@/lib/multiplayer/emitter";
import { readMultiplayerJson, writeMultiplayerJson } from "@/lib/multiplayer/storage";
import { SyncManager } from "@/lib/multiplayer/SyncManager";
import type { Emote } from "@/lib/multiplayer/types";

export const EMOTE_COOLDOWN_MS = 2000;

export const EMOTES: Emote[] = [
  { id: "wave", name: "Wave", icon: "👋", category: "friendly" },
  { id: "clap", name: "Clap", icon: "👏", category: "celebration" },
  { id: "laugh", name: "Laugh", icon: "😂", category: "reaction" },
  { id: "heart", name: "Heart", icon: "❤️", category: "friendly" },
  { id: "fire", name: "Fire", icon: "🔥", category: "celebration" },
  { id: "trophy", name: "Trophy", icon: "🏆", category: "celebration" },
  { id: "muscle", name: "Muscle", icon: "💪", category: "taunt" },
  { id: "star", name: "Star", icon: "⭐", category: "friendly" },
  { id: "cool", name: "Cool", icon: "😎", category: "reaction" },
  { id: "party", name: "Party", icon: "🎉", category: "celebration" },
  { id: "thumbs_up", name: "Thumbs Up", icon: "👍", category: "friendly" },
  { id: "thumbs_down", name: "Thumbs Down", icon: "👎", category: "taunt" },
];

export class EmoteService extends MultiplayerEmitter {
  private static instance: EmoteService | undefined;
  private recentEmotes: string[] = [];
  private favorites: string[] = [];
  private cooldowns = new Map<string, number>();
  private loaded = false;

  static getInstance(): EmoteService {
    if (!EmoteService.instance) EmoteService.instance = new EmoteService();
    return EmoteService.instance;
  }

  static resetInstance(): void {
    EmoteService.instance?.dispose();
    EmoteService.instance = undefined;
  }

  sendEmote(emoteId: string): Emote | null {
    const emote = EMOTES.find((entry) => entry.id === emoteId);
    if (!emote) return null;
    const lastUsed = this.cooldowns.get(emoteId) ?? 0;
    if (getClock().now() - lastUsed < EMOTE_COOLDOWN_MS) {
      this.emit("cooldown", emoteId);
      return null;
    }
    this.cooldowns.set(emoteId, getClock().now());
    SyncManager.getInstance().sendEmote(emoteId);
    this.recentEmotes = [emoteId, ...this.recentEmotes.filter((id) => id !== emoteId)].slice(0, 10);
    this.emit("emote-sent", emote);
    return emote;
  }

  reactToEmote(emoteId: string, targetId: string): void {
    this.emit("reaction", { emoteId, targetId });
  }

  getEmotes(): Emote[] {
    return EMOTES;
  }

  getEmotesByCategory(category: Emote["category"]): Emote[] {
    return EMOTES.filter((emote) => emote.category === category);
  }

  getRecentEmotes(): Emote[] {
    return this.recentEmotes.map((id) => EMOTES.find((emote) => emote.id === id)).filter((emote): emote is Emote => Boolean(emote));
  }

  async toggleFavorite(emoteId: string): Promise<void> {
    await this.ensureLoaded();
    this.favorites = this.favorites.includes(emoteId)
      ? this.favorites.filter((id) => id !== emoteId)
      : [...this.favorites, emoteId];
    await writeMultiplayerJson("tug-of-war-emote-favorites", this.favorites);
    this.emit("favorites-updated", this.favorites);
  }

  async getFavorites(): Promise<Emote[]> {
    await this.ensureLoaded();
    return this.favorites.map((id) => EMOTES.find((emote) => emote.id === id)).filter((emote): emote is Emote => Boolean(emote));
  }

  dispose(): void {
    this.recentEmotes = [];
    this.favorites = [];
    this.cooldowns.clear();
    this.loaded = false;
    this.removeAllListeners();
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    this.loaded = true;
    this.favorites = (await readMultiplayerJson<string[]>("tug-of-war-emote-favorites")) ?? [];
  }
}
