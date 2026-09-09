import {
  classifyGraphicsError,
  createGraphicsErrorEvent,
  type GraphicsErrorCategory,
  type GraphicsErrorEvent,
} from "./errors";

export interface GraphicsRecoveryState {
  hasError: boolean;
  category: GraphicsErrorCategory | null;
  message: string | null;
  retryCount: number;
  disableEffects: boolean;
}

export type GraphicsRecoveryAction =
  | { type: "capture"; error?: unknown; message?: string; category?: GraphicsErrorCategory }
  | { type: "reset" };

export const initialGraphicsRecoveryState: GraphicsRecoveryState = {
  hasError: false,
  category: null,
  message: null,
  retryCount: 0,
  disableEffects: false,
};

export function shouldDisableEffects(category: GraphicsErrorCategory | null): boolean {
  return category === "animation" || category === "render" || category === "performance" || category === "context_loss";
}

export function reduceGraphicsRecovery(
  state: GraphicsRecoveryState,
  action: GraphicsRecoveryAction,
): GraphicsRecoveryState {
  if (action.type === "reset") {
    return {
      ...initialGraphicsRecoveryState,
      retryCount: state.retryCount,
    };
  }

  const source = action.message ?? action.error ?? "Graphics rendering failed";
  const event = createGraphicsErrorEvent(source, action.category);
  return {
    hasError: true,
    category: event.category,
    message: event.message,
    retryCount: state.retryCount + 1,
    disableEffects: shouldDisableEffects(event.category),
  };
}

export function captureGraphicsFailure(
  error: unknown,
  category?: GraphicsErrorCategory,
): GraphicsErrorEvent {
  return createGraphicsErrorEvent(error, category ?? classifyGraphicsError(error));
}
