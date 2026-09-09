import { Logger } from "../logger";
import type { PerformanceReport } from "./types";

type FrameScheduler = (callback: () => void) => { cancel: () => void };

const defaultScheduler: FrameScheduler = (callback) => {
  if (typeof requestAnimationFrame === "function") {
    const id = requestAnimationFrame(() => callback());
    return { cancel: () => cancelAnimationFrame(id) };
  }
  const id = setTimeout(callback, 16);
  return { cancel: () => clearTimeout(id) };
};

export class PerformanceMonitor {
  private static instance: PerformanceMonitor | null = null;

  private frameCount = 0;
  private lastFpsCheck = 0;
  private fps = 60;
  private droppedFrames = 0;
  private warningThreshold = 30;
  private running = false;
  private cancel: (() => void) | null = null;
  private scheduler: FrameScheduler = defaultScheduler;
  private nowFn: () => number = () =>
    typeof performance !== "undefined" && typeof performance.now === "function" ? performance.now() : Date.now();
  private onPerformanceIssue: ((report: PerformanceReport) => void) | null = null;
  private memoryProbe: () => number = () => this.readHeapMb();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  static resetInstance(): void {
    PerformanceMonitor.instance?.stopMonitoring();
    PerformanceMonitor.instance = null;
  }

  configure(options: { scheduler?: FrameScheduler; now?: () => number; memoryProbe?: () => number; warningThreshold?: number }): void {
    if (options.scheduler) this.scheduler = options.scheduler;
    if (options.now) this.nowFn = options.now;
    if (options.memoryProbe) this.memoryProbe = options.memoryProbe;
    if (options.warningThreshold !== undefined) this.warningThreshold = options.warningThreshold;
  }

  startMonitoring(): void {
    if (this.running) return;
    this.running = true;
    this.frameCount = 0;
    this.lastFpsCheck = this.nowFn();
    this.loop();
  }

  stopMonitoring(): void {
    this.running = false;
    this.cancel?.();
    this.cancel = null;
  }

  /**
   * Push one sampled frame. Tests can drive this without a rAF loop.
   */
  tick(now: number = this.nowFn()): PerformanceReport | null {
    this.frameCount += 1;
    if (this.lastFpsCheck === 0) this.lastFpsCheck = now;
    if (now - this.lastFpsCheck < 1000) return null;
    this.fps = this.frameCount;
    this.frameCount = 0;
    this.lastFpsCheck = now;
    return this.checkPerformance();
  }

  private loop = () => {
    if (!this.running) return;
    this.tick();
    const handle = this.scheduler(this.loop);
    this.cancel = handle.cancel;
  };

  private checkPerformance(): PerformanceReport | null {
    if (this.fps >= this.warningThreshold) return null;
    const report: PerformanceReport = {
      fps: this.fps,
      memory: this.memoryProbe(),
      droppedFrames: this.droppedFrames + 1,
      timestamp: Date.now(),
    };
    this.droppedFrames += 1;
    Logger.warn(`Performance issue: ${this.fps} FPS`, report);
    this.onPerformanceIssue?.(report);
    return report;
  }

  private readHeapMb(): number {
    try {
      const memory = (performance as { memory?: { usedJSHeapSize?: number } } | undefined)?.memory;
      const used = memory?.usedJSHeapSize;
      if (!used || !Number.isFinite(used)) return 0;
      return used / (1024 * 1024);
    } catch {
      return 0;
    }
  }

  onIssue(callback: (report: PerformanceReport) => void): void {
    this.onPerformanceIssue = callback;
  }

  getCurrentFPS(): number {
    return this.fps;
  }

  getDroppedFrames(): number {
    return this.droppedFrames;
  }

  isRunning(): boolean {
    return this.running;
  }
}
