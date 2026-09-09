import { GraphicsLogger, reportGraphicsError } from "./logger";

function currentPlatform(): string {
  try {
    // Lazy to keep the graphics test suite free of react-native Flow sources.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Platform } = require("react-native") as { Platform?: { OS?: string } };
    return Platform?.OS ?? "unknown";
  } catch {
    return "unknown";
  }
}

export class ErrorReportingService {
  private static instance: ErrorReportingService | null = null;
  private reports: { category: string; message: string; platform: string }[] = [];

  static getInstance(): ErrorReportingService {
    if (!ErrorReportingService.instance) {
      ErrorReportingService.instance = new ErrorReportingService();
    }
    return ErrorReportingService.instance;
  }

  static resetInstance(): void {
    ErrorReportingService.instance = null;
  }

  reportGraphicsError(componentName: string, error: Error, context?: unknown): void {
    reportGraphicsError(error, componentName);
    this.reports.push({
      category: componentName,
      message: error.message,
      platform: currentPlatform(),
    });
    if (typeof console !== "undefined") {
      console.warn(`[ErrorReport] ${componentName}: ${error.message}`, context);
    }
  }

  reportWarning(componentName: string, message: string, context?: unknown): void {
    GraphicsLogger.getInstance().log("warning", "render", message, {
      componentName,
      details: context,
    });
  }

  getReports(): readonly { category: string; message: string; platform: string }[] {
    return this.reports;
  }
}
