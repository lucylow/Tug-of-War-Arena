/**
 * Visibility-aware FPS sampling. Backgrounded or off-screen arenas must
 * not report false low-FPS events or keep a hot rAF loop.
 */

export interface FrameClock {
  now: () => number;
  requestFrame: (cb: () => void) => number;
  cancelFrame: (id: number) => void;
}

export interface VisibilityAwareHandle {
  stop: () => void;
  setVisible: (visible: boolean) => void;
  isVisible: () => boolean;
  isRunning: () => boolean;
}

export interface FpsSample {
  fps: number;
  visible: boolean;
  at: number;
}

const LOW_FPS = 30;

export class VisibilityAwareMonitor {
  private static instance: VisibilityAwareMonitor | null = null;
  private visible = true;

  static getInstance(): VisibilityAwareMonitor {
    if (!VisibilityAwareMonitor.instance) {
      VisibilityAwareMonitor.instance = new VisibilityAwareMonitor();
    }
    return VisibilityAwareMonitor.instance;
  }

  static resetInstance(): void {
    VisibilityAwareMonitor.instance = null;
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
  }

  isVisible(): boolean {
    return this.visible;
  }

  start(
    onSample: (sample: FpsSample) => void,
    clock: FrameClock,
    onLowFps?: (fps: number) => void,
  ): VisibilityAwareHandle {
    let frameCount = 0;
    let lastCheck = clock.now();
    let frameId = 0;
    let running = true;
    let visible = this.visible;

    const tick = () => {
      if (!running) return;
      if (visible) {
        frameCount += 1;
        const now = clock.now();
        if (now - lastCheck >= 1000) {
          const fps = frameCount;
          frameCount = 0;
          lastCheck = now;
          onSample({ fps, visible: true, at: now });
          if (fps < LOW_FPS) onLowFps?.(fps);
        }
      } else {
        frameCount = 0;
        lastCheck = clock.now();
      }
      frameId = clock.requestFrame(tick);
    };

    frameId = clock.requestFrame(tick);

    return {
      stop: () => {
        running = false;
        clock.cancelFrame(frameId);
      },
      setVisible: (next) => {
        visible = next;
        this.visible = next;
        if (!next) {
          frameCount = 0;
          lastCheck = clock.now();
        }
      },
      isVisible: () => visible,
      isRunning: () => running,
    };
  }
}

export function shouldSampleFps(visible: boolean, appState: string): boolean {
  return visible && appState === "active";
}
