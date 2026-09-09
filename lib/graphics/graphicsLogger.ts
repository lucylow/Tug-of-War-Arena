export {
  GraphicsLogger,
  reportGraphicsError,
} from "./logger";
export type { GraphicsLogEntry } from "./logger";

export enum GraphicsErrorSeverity {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  FATAL = "fatal",
}

export type GraphicsErrorLog = import("./logger").GraphicsLogEntry;
