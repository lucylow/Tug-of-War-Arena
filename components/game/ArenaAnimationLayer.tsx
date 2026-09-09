import { memo } from "react";

import { GraphicsErrorBoundary } from "@/components/errorBoundary/GraphicsErrorBoundary";
import { ComboDisplay } from "./ComboDisplay";
import { CountdownOverlay } from "./CountdownOverlay";
import { comboMultiplier } from "@/lib/animations";

export interface ArenaAnimationLayerProps {
  countdown: number | null;
  onCountdownComplete: () => void;
  combo: number;
  reduceMotion?: boolean;
}

export const ArenaAnimationLayer = memo(function ArenaAnimationLayer({
  countdown,
  onCountdownComplete,
  combo,
  reduceMotion = false,
}: ArenaAnimationLayerProps) {
  return (
    <GraphicsErrorBoundary componentName="ArenaAnimationLayer" fallback={null}>
      <ComboDisplay combo={combo} multiplier={comboMultiplier(combo)} reduceMotion={reduceMotion} />
      {countdown !== null ? (
        <CountdownOverlay count={countdown} onComplete={onCountdownComplete} reduceMotion={reduceMotion} />
      ) : null}
    </GraphicsErrorBoundary>
  );
});
