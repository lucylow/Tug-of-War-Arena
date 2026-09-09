import { getClock, type IntervalHandle } from "@/lib/multiplayer/clock";
import { MultiplayerEmitter } from "@/lib/multiplayer/emitter";
import type { VoiceStatus } from "@/lib/multiplayer/types";

/**
 * Voice presence for the companion. Native WebRTC can be plugged in later
 * without changing the mute / connect surface used by the HUD.
 */
export class VoiceChatService extends MultiplayerEmitter {
  private static instance: VoiceChatService | undefined;
  private connected = false;
  private muted = false;
  private enabled = false;
  private audioLevel = 0;
  private roomId: string | null = null;
  private monitor: IntervalHandle | null = null;

  static getInstance(): VoiceChatService {
    if (!VoiceChatService.instance) VoiceChatService.instance = new VoiceChatService();
    return VoiceChatService.instance;
  }

  static resetInstance(): void {
    VoiceChatService.instance?.dispose();
    VoiceChatService.instance = undefined;
  }

  async connect(roomId: string): Promise<void> {
    if (this.connected) return;
    this.roomId = roomId;
    this.connected = true;
    this.enabled = true;
    this.emit("connected", roomId);
    this.startAudioMonitoring();
  }

  disconnect(): void {
    this.stopAudioMonitoring();
    this.connected = false;
    this.enabled = false;
    this.muted = false;
    this.roomId = null;
    this.emit("disconnected");
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.muted) this.audioLevel = 0;
    this.emit("mute-toggle", this.muted);
    return this.muted;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.muted = true;
    this.emit("enabled-toggle", enabled);
  }

  getStatus(): VoiceStatus {
    return {
      connected: this.connected,
      muted: this.muted,
      enabled: this.enabled,
      audioLevel: this.audioLevel,
      roomId: this.roomId,
    };
  }

  dispose(): void {
    this.disconnect();
    this.removeAllListeners();
  }

  private startAudioMonitoring(): void {
    this.stopAudioMonitoring();
    this.monitor = getClock().setInterval(() => {
      if (this.connected && this.enabled && !this.muted) {
        this.audioLevel = 12 + ((getClock().now() / 90) % 48);
        this.emit("audio-level", this.audioLevel);
      } else {
        this.audioLevel = 0;
      }
    }, 100);
  }

  private stopAudioMonitoring(): void {
    getClock().clearInterval(this.monitor);
    this.monitor = null;
    this.audioLevel = 0;
  }
}
