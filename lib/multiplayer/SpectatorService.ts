import { MultiplayerEmitter } from "@/lib/multiplayer/emitter";
import { SyncManager } from "@/lib/multiplayer/SyncManager";
import { playerList } from "@/lib/multiplayer/transport";
import type { MatchState, SpectatorInfo } from "@/lib/multiplayer/types";

export class SpectatorService extends MultiplayerEmitter {
  private static instance: SpectatorService | undefined;
  private isSpectating = false;
  private currentRoomId: string | null = null;
  private spectatorInfo: SpectatorInfo | null = null;
  private onState = (state: unknown) => {
    if (!this.isSpectating || !isMatchState(state)) return;
    this.spectatorInfo = {
      roomId: state.roomId,
      matchState: state,
      players: playerList(state),
      viewers: state.viewers,
      startedAt: this.spectatorInfo?.startedAt ?? Date.now(),
    };
    this.emit("spectator-update", state);
  };

  static getInstance(): SpectatorService {
    if (!SpectatorService.instance) SpectatorService.instance = new SpectatorService();
    return SpectatorService.instance;
  }

  static resetInstance(): void {
    SpectatorService.instance?.dispose();
    SpectatorService.instance = undefined;
  }

  async spectateMatch(roomId: string): Promise<void> {
    if (this.isSpectating) await this.stopSpectating();
    this.currentRoomId = roomId;
    this.isSpectating = true;
    const sync = SyncManager.getInstance();
    sync.on("state-change", this.onState);
    const room = await sync.connectToMatch(roomId, { spectator: true });
    this.spectatorInfo = {
      roomId: room.id,
      matchState: room.state,
      players: playerList(room.state),
      viewers: room.state.viewers,
      startedAt: Date.now(),
    };
    this.emit("spectator-connected", room.id);
  }

  async stopSpectating(): Promise<void> {
    SyncManager.getInstance().off("state-change", this.onState);
    if (this.isSpectating) SyncManager.getInstance().leaveMatch();
    this.isSpectating = false;
    this.currentRoomId = null;
    this.spectatorInfo = null;
    this.emit("spectator-disconnected");
  }

  getSpectatorInfo(): SpectatorInfo | null {
    return this.spectatorInfo;
  }

  getRoomId(): string | null {
    return this.currentRoomId;
  }

  isSpectatingNow(): boolean {
    return this.isSpectating;
  }

  dispose(): void {
    SyncManager.getInstance().off("state-change", this.onState);
    this.isSpectating = false;
    this.currentRoomId = null;
    this.spectatorInfo = null;
    this.removeAllListeners();
  }
}

function isMatchState(value: unknown): value is MatchState {
  return typeof value === "object" && value !== null && "roomId" in value && "players" in value;
}
