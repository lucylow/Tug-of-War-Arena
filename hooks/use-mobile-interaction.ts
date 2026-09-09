import { useMemo, useRef } from "react";

import { HapticService } from "@/lib/haptics";
import {
  createHapticBudget,
  createPullGate,
  createReactionGate,
  createSurgeGate,
  shouldPlayHaptic,
  type HapticBudget,
  type RateGate,
} from "@/lib/mobile-ux";

export function useMobileInteractionGates(os: string, reduceMotion: boolean): {
  pull: RateGate;
  reaction: RateGate;
  surge: RateGate;
  haptics: HapticBudget;
} {
  const pull = useRef(createPullGate()).current;
  const reaction = useRef(createReactionGate()).current;
  const surge = useRef(createSurgeGate()).current;
  const haptics = useMemo(
    () =>
      createHapticBudget({
        enabled: shouldPlayHaptic(os, reduceMotion),
        play: (kind) => HapticService.play(kind),
      }),
    [os, reduceMotion],
  );

  return { pull, reaction, surge, haptics };
}
