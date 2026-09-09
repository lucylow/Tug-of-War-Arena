import { MockEventEmitter, type MockEventHandler } from "@/lib/mock/emitter";

import type { ChatMessage } from "./types";
import { getSocialService } from "./SocialService";

type ChatListener = (message: ChatMessage) => void;

export class WebSocketService {
  private static instance: WebSocketService | null = null;
  private readonly events = new MockEventEmitter();
  private connected = false;

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  static resetForTests(): void {
    WebSocketService.instance = null;
  }

  connect(): void {
    this.connected = true;
    this.events.emit("connected");
  }

  disconnect(): void {
    this.connected = false;
    this.events.emit("disconnected");
  }

  isConnected(): boolean {
    return this.connected;
  }

  on(eventName: string, callback: MockEventHandler): void {
    this.events.on(eventName, callback);
  }

  off(eventName: string, callback: MockEventHandler): void {
    this.events.off(eventName, callback);
  }

  onChatMessage(listener: ChatListener): () => void {
    const wrapped: MockEventHandler = (payload) => listener(payload as ChatMessage);
    this.on("chat_message", wrapped);
    return () => this.off("chat_message", wrapped);
  }

  sendChatMessage(message: Omit<ChatMessage, "id" | "timestamp" | "read">): ChatMessage {
    const delivered = getSocialService().sendMessage(message);
    this.events.emit("chat_message", delivered);
    return delivered;
  }

  emitIncoming(message: ChatMessage): void {
    getSocialService().receiveMessage(message);
    this.events.emit("chat_message", message);
  }
}
