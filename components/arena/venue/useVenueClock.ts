import { useEffect, useState } from "react";

export function useVenueClock(active: boolean, fps: number): number {
  const [time, setTime] = useState(0);
  const safeFps = Number.isFinite(fps) && fps > 0 ? fps : 10;

  useEffect(() => {
    if (!active) {
      return undefined;
    }

    const interval = setInterval(() => {
      setTime((current) => current + 1 / safeFps);
    }, 1000 / safeFps);

    return () => clearInterval(interval);
  }, [active, safeFps]);

  return time;
}
