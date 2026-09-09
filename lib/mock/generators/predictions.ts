import { SeededRandom } from "@/lib/mock/seed";
import type { MockUser } from "@/lib/mock/generators/users";

export interface PredictionMarket {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  endDate: Date;
  resolved: boolean;
  outcome: "yes" | "no" | null;
  totalYes: number;
  totalNo: number;
}

const PREDICTION_TITLES = [
  "Will Red Faction win this season?",
  "Will the price of FZONE increase?",
  "Will a new NFT collection be released?",
  "Will the next update add a new game mode?",
  "Will the tournament champion be from the Blue Faction?",
] as const;

export function generatePredictions(
  count: number,
  users: MockUser[],
  random: SeededRandom,
): PredictionMarket[] {
  const predictions: PredictionMarket[] = [];
  if (users.length === 0) return predictions;
  for (let i = 0; i < count; i += 1) {
    predictions.push({
      id: `pred_${i}`,
      title: random.pick(PREDICTION_TITLES),
      description: "Predict the outcome of this event.",
      creatorId: random.pick(users).id,
      endDate: new Date(Date.now() + random.nextInt(1, 7) * 24 * 60 * 60 * 1000),
      resolved: false,
      outcome: null,
      totalYes: random.nextInt(100, 500),
      totalNo: random.nextInt(100, 500),
    });
  }
  return predictions;
}
