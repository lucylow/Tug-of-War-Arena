import { boundedQueue, COMPANION_RENDER_BUDGET } from "./budget";
import { NOTICE_MIN_INTERVAL_MS, canAcceptAt } from "./throttle";

export type NoticeKind = "info" | "success" | "warning" | "error";

export interface MobileNoticeItem {
  id: string;
  kind: NoticeKind;
  message: string;
  createdAt: number;
}

export interface NoticeQueueState {
  items: MobileNoticeItem[];
  lastAt: number;
}

export function emptyNoticeQueue(): NoticeQueueState {
  return { items: [], lastAt: Number.NEGATIVE_INFINITY };
}

export function enqueueNotice(
  state: NoticeQueueState,
  notice: Omit<MobileNoticeItem, "id" | "createdAt"> & { id?: string; createdAt?: number },
  now = Date.now(),
  max = COMPANION_RENDER_BUDGET.toastQueue,
): NoticeQueueState {
  if (!canAcceptAt(state.lastAt, NOTICE_MIN_INTERVAL_MS, now)) {
    return state;
  }
  const item: MobileNoticeItem = {
    id: notice.id ?? `notice-${now}`,
    kind: notice.kind,
    message: notice.message,
    createdAt: notice.createdAt ?? now,
  };
  return {
    items: boundedQueue([...state.items, item], max),
    lastAt: now,
  };
}

export function dismissNotice(state: NoticeQueueState, id: string): NoticeQueueState {
  return { ...state, items: state.items.filter((item) => item.id !== id) };
}
