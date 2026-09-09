import { useEffect, useState } from "react";

import { DemoModeManager } from "@/lib/mock/DemoModeManager";

/** Re-render when demo mode is enabled, disabled, or reseeds. */
export function useDemoModeTick(): void {
  const [, setGeneration] = useState(0);
  useEffect(
    () => DemoModeManager.getInstance().subscribe(() => setGeneration((value) => value + 1)),
    [],
  );
}
