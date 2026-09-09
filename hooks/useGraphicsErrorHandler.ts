import { useCallback, useState } from "react";

import type { GraphicsError } from "@/lib/graphics";
import { ErrorReportingService } from "@/lib/graphics/ErrorReportingService";
import { Logger } from "@/lib/logger";

export function useGraphicsErrorHandler(componentName: string) {
  const [lastError, setLastError] = useState<GraphicsError | null>(null);

  const handleError = useCallback(
    (error: GraphicsError) => {
      setLastError(error);
      Logger.error(`Graphics error in ${componentName}: ${error.message}`, error.details);
      ErrorReportingService.getInstance().reportGraphicsError(
        componentName,
        new Error(error.message || "Graphics rendering failed"),
        error.details,
      );
    },
    [componentName],
  );

  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  return { lastError, handleError, clearError };
}
