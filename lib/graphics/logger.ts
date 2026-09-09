import {
  classifyGraphicsError,
  createGraphicsErrorEvent,
  errorMessageOf,
  type GraphicsErrorCategory,
  type GraphicsErrorEvent,
  type GraphicsErrorSeverity,
} from "./errors";

export interface GraphicsLogEntry extends GraphicsErrorEvent {
  componentName?: string;
}

const DEFAULT_MAX_LOGS = 100;

export class GraphicsLogger {
  private static instance: GraphicsLogger | null = null;

  private logs: GraphicsLogEntry[] = [];
  private maxLogs: number;

  constructor(maxLogs: number = DEFAULT_MAX_LOGS) {
    this.maxLogs = Math.max(1, maxLogs);
  }

  static getInstance(): GraphicsLogger {
    if (!GraphicsLogger.instance) {
      GraphicsLogger.instance = new GraphicsLogger();
    }
    return GraphicsLogger.instance;
  }

  static resetInstance(): void {
    GraphicsLogger.instance = null;
  }

  log(
    severity: GraphicsErrorSeverity,
    category: GraphicsErrorCategory,
    message: string,
    context?: { componentName?: string; details?: unknown },
  ): GraphicsLogEntry {
    const entry: GraphicsLogEntry = {
      timestamp: Date.now(),
      severity,
      category,
      message,
      details: context?.details,
      componentName: context?.componentName,
    };
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) this.logs.shift();

    if (typeof console !== "undefined") {
      const label = `[graphics:${category}] ${message}`;
      if (severity === "fatal" || severity === "error") console.error(label, context?.details);
      else if (severity === "warning") console.warn(label, context?.details);
      else console.info(label, context?.details);
    }

    return entry;
  }

  capture(error: unknown, componentName?: string): GraphicsLogEntry {
    const event = createGraphicsErrorEvent(error);
    return this.log(event.severity, event.category, event.message, {
      componentName,
      details: error,
    });
  }

  getLogs(): GraphicsLogEntry[] {
    return [...this.logs];
  }

  getLast(): GraphicsLogEntry | null {
    return this.logs[this.logs.length - 1] ?? null;
  }

  clear(): void {
    this.logs = [];
  }
}

export function reportGraphicsError(
  error: unknown,
  componentName?: string,
  category: GraphicsErrorCategory = classifyGraphicsError(error),
): GraphicsLogEntry {
  return GraphicsLogger.getInstance().log(
    createGraphicsErrorEvent(error, category).severity,
    category,
    errorMessageOf(error),
    { componentName, details: error },
  );
}
