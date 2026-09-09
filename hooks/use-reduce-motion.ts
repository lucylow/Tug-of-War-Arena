import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

export function useReduceMotion(initial = false): boolean {
  const [reduceMotion, setReduceMotion] = useState(initial);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted) setReduceMotion(value);
      })
      .catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return reduceMotion;
}
