/**
 * Performance helpers for the mobile companion and a future SDK7 scene.
 *
 * @see https://docs.decentraland.org/creator/build-for-mobile/develop/optimize-performance
 */

import { isMobile } from "./platform";

export interface FrameClock {
  now: () => number;
  requestFrame: (cb: () => void) => number;
  cancelFrame: (id: number) => void;
}

export interface PerformanceMonitorHandle {
  stop: () => void;
}

const LOW_FPS_THRESHOLD = 30;

export class MobileOptimizer {
  private static instance: MobileOptimizer | null = null;

  static getInstance(): MobileOptimizer {
    if (!MobileOptimizer.instance) MobileOptimizer.instance = new MobileOptimizer();
    return MobileOptimizer.instance;
  }

  static resetInstance(): void {
    MobileOptimizer.instance = null;
  }

  lazyLoadDistance(loadDistance: number = 16): number {
    return isMobile() ? loadDistance * 0.75 : loadDistance;
  }

  /**
   * FPS sampler. Callers must `stop()` — this never starts a global loop
   * on its own. Tests inject a fake clock so nothing hangs.
   */
  enablePerformanceMonitoring(
    onLowFps: (fps: number) => void,
    clock: FrameClock,
  ): PerformanceMonitorHandle {
    if (!isMobile()) return { stop: () => undefined };

    let frameCount = 0;
    let lastCheck = clock.now();
    let frameId = 0;
    let running = true;

    const tick = () => {
      if (!running) return;
      frameCount += 1;
      const now = clock.now();
      if (now - lastCheck >= 1000) {
        const fps = frameCount;
        frameCount = 0;
        lastCheck = now;
        if (fps < LOW_FPS_THRESHOLD) onLowFps(fps);
      }
      frameId = clock.requestFrame(tick);
    };

    frameId = clock.requestFrame(tick);
    return {
      stop: () => {
        running = false;
        clock.cancelFrame(frameId);
      },
    };
  }
}
