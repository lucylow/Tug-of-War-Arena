export interface Quest {
  id: string;
  title: string;
  description: string;
  type: "daily" | "weekly" | "special";
  objective: string;
  target: number;
  rewardXP: number;
  rewardTokens: number;
  rewardBadgeId: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

const QUEST_TEMPLATES = [
  { title: "Win 3 Matches", obj: "win_matches", target: 3, xp: 50, tokens: 10 },
  { title: "Play 5 Matches", obj: "play_matches", target: 5, xp: 30, tokens: 5 },
  { title: "Earn 200 XP", obj: "earn_xp", target: 200, xp: 40, tokens: 8 },
  { title: "Collect 2 NFTs", obj: "collect_nfts", target: 2, xp: 60, tokens: 15 },
  { title: "Stake 1 NFT", obj: "stake_nft", target: 1, xp: 70, tokens: 20 },
  { title: "Win with 2+ Streak", obj: "win_streak", target: 2, xp: 80, tokens: 25 },
  { title: "Refer a Friend", obj: "refer_friend", target: 1, xp: 90, tokens: 30 },
  { title: "Join a Guild", obj: "join_guild", target: 1, xp: 50, tokens: 15 },
  { title: "Pull Together", obj: "crew_pulls", target: 100, xp: 45, tokens: 12 },
  { title: "Plaza Presence", obj: "visit_plaza", target: 1, xp: 20, tokens: 4 },
  { title: "Moonlight Duel", obj: "win_duel", target: 1, xp: 55, tokens: 14 },
  { title: "Invite a Crewmate", obj: "invite_crew", target: 2, xp: 35, tokens: 8 },
  { title: "Wear a Legendary", obj: "equip_legendary", target: 1, xp: 80, tokens: 22 },
  { title: "Friday Night Pull", obj: "play_featured", target: 1, xp: 40, tokens: 10 },
  { title: "Claim Stake Rewards", obj: "claim_stake", target: 1, xp: 25, tokens: 6 },
  { title: "Place a Prediction", obj: "place_prediction", target: 1, xp: 30, tokens: 7 },
] as const;

export function generateQuests(count: number): Quest[] {
  const quests: Quest[] = [];
  for (let i = 0; i < count; i += 1) {
    const template = QUEST_TEMPLATES[i % QUEST_TEMPLATES.length]!;
    const lane = i % 3;
    const progress = lane === 0 ? 0 : lane === 1 ? Math.max(1, Math.floor(template.target / 2)) : template.target;
    const completed = lane === 2;
    quests.push({
      id: `quest_${i}`,
      title: template.title,
      description: `Complete ${template.obj} ${template.target} times.`,
      type: i % 2 === 0 ? "daily" : i % 5 === 0 ? "special" : "weekly",
      objective: template.obj,
      target: template.target,
      rewardXP: template.xp,
      rewardTokens: template.tokens,
      rewardBadgeId: i % 3,
      progress,
      completed,
      claimed: false,
    });
  }
  return quests;
}
