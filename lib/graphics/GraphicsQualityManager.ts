import { Logger } from "../logger";
import { PerformanceMonitor } from "./PerformanceMonitor";
import {
  configForLevel,
  nextQualityForFps,
  type GraphicsConfig,
  type PerformanceReport,
  type QualityLevel,
} from "./types";

export type QualityListener = (level: QualityLevel, config: GraphicsConfig) => void;

export class GraphicsQualityManager {
  private static instance: GraphicsQualityManager | null = null;

  private currentLevel: QualityLevel = "high";
  private config: GraphicsConfig = configForLevel("high");
  private listeners: QualityListener[] = [];
  private armed = false;

  static getInstance(): GraphicsQualityManager {
    if (!GraphicsQualityManager.instance) {
      GraphicsQualityManager.instance = new GraphicsQualityManager();
    }
    return GraphicsQualityManager.instance;
  }

  static resetInstance(): void {
    PerformanceMonitor.resetInstance();
    GraphicsQualityManager.instance = null;
  }

  /**
   * Subscribe to FPS drops from PerformanceMonitor. Safe to call more than once.
   */
  arm(): void {
    if (this.armed) return;
    this.armed = true;
    const monitor = PerformanceMonitor.getInstance();
    monitor.onIssue((report) => this.handlePerformanceIssue(report));
    monitor.startMonitoring();
  }

  handlePerformanceIssue(report: PerformanceReport): QualityLevel {
    const next = nextQualityForFps(this.currentLevel, report.fps);
    if (next !== this.currentLevel) {
      this.setQuality(next);
    }
    return this.currentLevel;
  }

  setQuality(level: QualityLevel): void {
    if (level === this.currentLevel) return;
    this.currentLevel = level;
    this.config = configForLevel(level);
    Logger.info(`Graphics quality changed to ${level}`);
    for (const listener of this.listeners) {
      listener(this.currentLevel, this.config);
    }
  }

  onChange(listener: QualityListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((item) => item !== listener);
    };
  }

  getConfig(): GraphicsConfig {
    return { ...this.config };
  }

  getCurrentLevel(): QualityLevel {
    return this.currentLevel;
  }

  isArmed(): boolean {
    return this.armed;
  }
}
