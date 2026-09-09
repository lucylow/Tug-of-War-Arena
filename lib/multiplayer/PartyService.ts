import { getClock } from "@/lib/multiplayer/clock";
import { MultiplayerEmitter } from "@/lib/multiplayer/emitter";
import { getPlayerAvatar, getPlayerId, getPlayerName } from "@/lib/multiplayer/identity";
import { readMultiplayerJson, writeMultiplayerJson } from "@/lib/multiplayer/storage";
import type { CrewTeam, Party, PartyMember } from "@/lib/multiplayer/types";

const partyRegistry = new Map<string, Party>();

export function resetPartyRegistry(): void {
  partyRegistry.clear();
}

export class PartyService extends MultiplayerEmitter {
  private static instance: PartyService | undefined;
  private currentParty: Party | null = null;
  private loaded = false;

  static getInstance(): PartyService {
    if (!PartyService.instance) PartyService.instance = new PartyService();
    return PartyService.instance;
  }

  static resetInstance(): void {
    PartyService.instance?.dispose();
    PartyService.instance = undefined;
  }

  async createParty(name: string, gameMode = "standard"): Promise<Party> {
    await this.ensureLoaded();
    const member = await this.selfMember(true);
    const inviteCode = generateInviteCode();
    this.currentParty = {
      id: `party_${getClock().now()}`,
      name: name || `${member.name}'s Party`,
      leaderId: member.id,
      members: [member],
      inviteCode,
      createdAt: getClock().now(),
      maxMembers: 8,
      gameMode,
    };
    partyRegistry.set(inviteCode, this.currentParty);
    await this.saveState();
    this.emit("party-created", this.currentParty);
    return this.currentParty;
  }

  async joinParty(inviteCode: string): Promise<Party> {
    await this.ensureLoaded();
    const party = await this.fetchPartyByCode(inviteCode.trim().toUpperCase());
    if (!party) throw new Error("Invalid invite code");
    if (party.members.length >= party.maxMembers) throw new Error("Party is full");

    const member = await this.selfMember(false);
    if (!party.members.some((entry) => entry.id === member.id)) {
      party.members.push(member);
    }
    this.currentParty = party;
    partyRegistry.set(party.inviteCode, party);
    await this.saveState();
    this.emit("party-joined", party);
    return party;
  }

  async leaveParty(): Promise<void> {
    await this.ensureLoaded();
    if (!this.currentParty) return;
    const playerId = await getPlayerId();
    const remaining = this.currentParty.members.filter((member) => member.id !== playerId);

    if (remaining.length === 0) {
      partyRegistry.delete(this.currentParty.inviteCode);
      this.currentParty = null;
      await this.saveState();
      this.emit("party-disbanded");
      return;
    }

    if (this.currentParty.leaderId === playerId) {
      const nextLeader = remaining[0]!;
      nextLeader.isLeader = true;
      this.currentParty.leaderId = nextLeader.id;
    }
    this.currentParty.members = remaining;
    partyRegistry.set(this.currentParty.inviteCode, this.currentParty);
    this.currentParty = null;
    await this.saveState();
    this.emit("party-left");
  }

  async toggleReady(): Promise<void> {
    await this.ensureLoaded();
    if (!this.currentParty) return;
    const playerId = await getPlayerId();
    const member = this.currentParty.members.find((entry) => entry.id === playerId);
    if (!member) return;
    member.isReady = !member.isReady;
    partyRegistry.set(this.currentParty.inviteCode, this.currentParty);
    this.emit("party-updated", this.currentParty);
    await this.saveState();
    if (this.currentParty.members.every((entry) => entry.isReady)) {
      this.emit("party-ready", this.currentParty);
    }
  }

  async shareInvite(): Promise<string | null> {
    if (!this.currentParty) return null;
    const message = `Join my Tug of War Arena party with code ${this.currentParty.inviteCode}`;
    this.emit("invite-ready", message);
    return message;
  }

  getParty(): Party | null {
    return this.currentParty;
  }

  getMembers(): PartyMember[] {
    return this.currentParty?.members ?? [];
  }

  async isLeader(): Promise<boolean> {
    if (!this.currentParty) return false;
    return this.currentParty.leaderId === (await getPlayerId());
  }

  isReady(): boolean {
    if (!this.currentParty) return false;
    return this.currentParty.members.every((member) => member.isReady);
  }

  setTeam(memberId: string, team: CrewTeam): void {
    if (!this.currentParty) return;
    const member = this.currentParty.members.find((entry) => entry.id === memberId);
    if (!member) return;
    member.team = team;
    this.emit("party-updated", this.currentParty);
  }

  dispose(): void {
    this.removeAllListeners();
    this.currentParty = null;
    this.loaded = false;
  }

  private async selfMember(isLeader: boolean): Promise<PartyMember> {
    const id = await getPlayerId();
    const name = await getPlayerName();
    return {
      id,
      name,
      avatar: getPlayerAvatar(id),
      isReady: false,
      isLeader,
    };
  }

  private async fetchPartyByCode(code: string): Promise<Party | null> {
    const existing = partyRegistry.get(code);
    if (existing) return existing;
    if (code.length < 6) return null;
    return {
      id: `party_${getClock().now()}`,
      name: "Friendzone Party",
      leaderId: "leader_remote",
      members: [
        {
          id: "leader_remote",
          name: "Host",
          avatar: getPlayerAvatar("2"),
          isReady: true,
          isLeader: true,
        },
      ],
      inviteCode: code,
      createdAt: getClock().now(),
      maxMembers: 8,
      gameMode: "standard",
    };
  }

  private async saveState(): Promise<void> {
    await writeMultiplayerJson("tug-of-war-current-party", this.currentParty);
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    this.loaded = true;
    const stored = await readMultiplayerJson<Party>("tug-of-war-current-party");
    if (stored?.inviteCode) {
      this.currentParty = stored;
      partyRegistry.set(stored.inviteCode, stored);
    }
  }
}

function generateInviteCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)] ?? "X";
  }
  return code;
}
