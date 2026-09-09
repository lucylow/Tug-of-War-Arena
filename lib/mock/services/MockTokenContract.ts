import { sleep } from "@/lib/mock/config";
import type { MockWorld } from "@/lib/mock/services/MockWorld";

/**
 * In-memory FZONE token surface (balance, transfer, approve, mint, burn).
 */
export class MockTokenContract {
  constructor(
    private readonly world: MockWorld,
    private readonly delayMs: number = 0,
  ) {}

  private async delay(): Promise<void> {
    await sleep(this.delayMs);
  }

  async balanceOf(account: string): Promise<number> {
    await this.delay();
    return this.world.getBalance(account);
  }

  async transfer(from: string, to: string, amount: number): Promise<boolean> {
    await this.delay();
    this.move(from, to, amount);
    return true;
  }

  async transferFrom(spender: string, from: string, to: string, amount: number): Promise<boolean> {
    await this.delay();
    const owner = this.world.resolveUserId(from);
    const allowed = this.world.allowances.get(owner)?.get(this.world.resolveUserId(spender)) ?? 0;
    if (allowed < amount) throw new Error("Insufficient allowance");
    this.world.allowances.get(owner)?.set(this.world.resolveUserId(spender), allowed - amount);
    this.move(from, to, amount);
    return true;
  }

  async approve(owner: string, spender: string, amount: number): Promise<boolean> {
    await this.delay();
    const ownerId = this.world.resolveUserId(owner);
    const spenderId = this.world.resolveUserId(spender);
    const row = this.world.allowances.get(ownerId) ?? new Map<string, number>();
    row.set(spenderId, amount);
    this.world.allowances.set(ownerId, row);
    this.world.events.emit("Approval", { owner: ownerId, spender: spenderId, amount });
    return true;
  }

  async allowance(owner: string, spender: string): Promise<number> {
    await this.delay();
    return this.world.allowances.get(this.world.resolveUserId(owner))?.get(this.world.resolveUserId(spender)) ?? 0;
  }

  async mint(to: string, amount: number): Promise<void> {
    await this.delay();
    const next = this.world.getBalance(to) + amount;
    this.world.setBalance(to, next);
    this.world.events.emit("Transfer", { from: "0x0", to: this.world.resolveUserId(to), amount });
  }

  async burn(from: string, amount: number): Promise<void> {
    await this.delay();
    const current = this.world.getBalance(from);
    if (current < amount) throw new Error("Insufficient balance");
    this.world.setBalance(from, current - amount);
    this.world.events.emit("Transfer", { from: this.world.resolveUserId(from), to: "0x0", amount });
  }

  private move(from: string, to: string, amount: number): void {
    if (amount <= 0) throw new Error("Amount must be positive");
    const fromBalance = this.world.getBalance(from);
    if (fromBalance < amount) throw new Error("Insufficient balance");
    this.world.setBalance(from, fromBalance - amount);
    this.world.setBalance(to, this.world.getBalance(to) + amount);
    this.world.events.emit("Transfer", {
      from: this.world.resolveUserId(from),
      to: this.world.resolveUserId(to),
      amount,
    });
  }
}
