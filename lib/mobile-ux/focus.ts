/**
 * Modal focus helpers. Pure so tests can assert restore behavior without a DOM.
 */

export interface FocusSnapshot {
  previousId: string | null;
  modalId: string;
}

export function captureFocus(previousId: string | null, modalId: string): FocusSnapshot {
  return { previousId, modalId };
}

export function restoreFocusId(snapshot: FocusSnapshot | null): string | null {
  return snapshot?.previousId ?? null;
}

export function modalA11yProps(open: boolean, title: string): {
  accessibilityViewIsModal: boolean;
  accessibilityRole: "none" | "alert";
  accessibilityLabel: string;
} {
  return {
    accessibilityViewIsModal: open,
    accessibilityRole: open ? "alert" : "none",
    accessibilityLabel: title,
  };
}

export function shouldLockBackground(open: boolean): boolean {
  return open;
}
