import { SeededRandom } from "@/lib/mock/seed";
import type { MockUser } from "@/lib/mock/generators/users";

export interface Friend {
  userId: string;
  friendId: string;
  since: Date;
}

export interface Guild {
  id: string;
  name: string;
  leaderId: string;
  members: string[];
  reputation: number;
  createdAt: Date;
}

export interface Referral {
  referrerId: string;
  refereeId: string;
  rewarded: boolean;
  createdAt: Date;
}

const GUILD_NAMES = [
  "Shadow Warriors",
  "Dragon Knights",
  "Crimson Dawn",
  "Golden Legion",
  "Phoenix Rising",
  "Storm Riders",
  "Iron Vanguard",
  "Eternal Guardians",
] as const;

export function generateFriendships(users: MockUser[], random: SeededRandom): Friend[] {
  const friendships: Friend[] = [];
  for (let i = 0; i < users.length; i += 1) {
    const user = users[i];
    if (!user) continue;
    const candidates = users.filter((_, idx) => idx !== i);
    const friends = random.shuffle(candidates).slice(0, random.nextInt(3, 12));
    for (const friend of friends) {
      if (i < users.indexOf(friend)) {
        friendships.push({
          userId: user.id,
          friendId: friend.id,
          since: new Date(Date.now() - random.nextInt(0, 90) * 24 * 60 * 60 * 1000),
        });
      }
    }
  }
  return friendships;
}

export function generateGuilds(users: MockUser[], random: SeededRandom): Guild[] {
  const guilds: Guild[] = [];
  if (users.length === 0) return guilds;
  const numGuilds = Math.min(users.length, random.nextInt(3, 8));
  for (let i = 0; i < numGuilds; i += 1) {
    const leader = random.pick(users);
    const members = random.shuffle(users.filter((user) => user.id !== leader.id)).slice(0, random.nextInt(2, 8));
    guilds.push({
      id: `guild_${i}`,
      name: random.pick(GUILD_NAMES),
      leaderId: leader.id,
      members: [leader, ...members].map((member) => member.id),
      reputation: random.nextInt(100, 500),
      createdAt: new Date(Date.now() - random.nextInt(0, 180) * 24 * 60 * 60 * 1000),
    });
  }
  return guilds;
}

export function generateReferrals(users: MockUser[], random: SeededRandom): Referral[] {
  const referrals: Referral[] = [];
  if (users.length < 2) return referrals;
  const count = Math.min(users.length - 1, random.nextInt(8, 24));
  for (let i = 0; i < count; i += 1) {
    const referrer = users[i]!;
    const referee = users[i + 1] ?? users[0]!;
    if (referrer.id === referee.id) continue;
    referrals.push({
      referrerId: referrer.id,
      refereeId: referee.id,
      rewarded: random.nextInt(0, 100) > 35,
      createdAt: new Date(Date.now() - random.nextInt(1, 60) * 24 * 60 * 60 * 1000),
    });
  }
  return referrals;
}
