import { useEffect, useMemo, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

import {
  VisibilityAwareMonitor,
  createDiagnosticSnapshot,
  shouldSampleFps,
  type DiagnosticSnapshot,
  type FrameClock,
} from "@/lib/mobile-ux";

function nativeClock(): FrameClock {
  return {
    now: () => (typeof performance !== "undefined" ? performance.now() : Date.now()),
    requestFrame: (cb) => (typeof requestAnimationFrame === "function" ? requestAnimationFrame(cb) : (setTimeout(cb, 16) as unknown as number)),
    cancelFrame: (id) => {
      if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(id);
      else clearTimeout(id);
    },
  };
}

export function useVisibilityPerformance(enabled = typeof __DEV__ !== "undefined" && __DEV__): DiagnosticSnapshot {
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [snapshot, setSnapshot] = useState<DiagnosticSnapshot>(() =>
    createDiagnosticSnapshot({ fps: 60, visible: true }),
  );
  const monitor = useMemo(() => VisibilityAwareMonitor.getInstance(), []);
  const clockRef = useRef<FrameClock>(nativeClock());

  useEffect(() => {
    const sub = AppState.addEventListener("change", setAppState);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const visible = shouldSampleFps(true, appState);
    const handle = monitor.start(
      (sample) => {
        setSnapshot(createDiagnosticSnapshot({ fps: sample.fps, visible: sample.visible }));
      },
      clockRef.current,
    );
    handle.setVisible(visible);
    return () => handle.stop();
  }, [appState, enabled, monitor]);

  return snapshot;
}
