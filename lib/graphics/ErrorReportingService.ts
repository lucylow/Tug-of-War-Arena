import { reportGraphicsError } from "./logger";
import { GraphicsLogger } from "./logger";

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
  private reports: Array<{ category: string; message: string; platform: string }> = [];

  static getInstance(): ErrorReportingService {
    if (!ErrorReportingService.instance) {
      ErrorReportingService.instance = new ErrorReportingService();
    }
    return ErrorReportingService.instance;
  }

  static resetInstance(): void {
    ErrorReportingService.instance = null;
  }

  reportGraphicsError(category: string, error: Error, context?: unknown): void {
    reportGraphicsError(error, category);
    GraphicsLogger.getInstance().log("error", "render", error.message, {
      componentName: category,
      details: context,
    });
    this.reports.push({
      category,
      message: error.message,
      platform: currentPlatform(),
    });
    console.warn(`[ErrorReport] ${category}: ${error.message}`);
  }

  reportWarning(category: string, message: string, context?: unknown): void {
    GraphicsLogger.getInstance().log("warning", "render", message, {
      componentName: category,
      details: context,
    });
  }

  getReports(): readonly { category: string; message: string; platform: string }[] {
    return this.reports;
  }
}
