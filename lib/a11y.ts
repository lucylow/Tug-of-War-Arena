import { Platform } from "react-native";

type HiddenA11y = {
  accessibilityElementsHidden?: boolean;
  importantForAccessibility?: "no-hide-descendants";
  "aria-hidden"?: boolean;
};

const isNative = Platform.OS === "ios" || Platform.OS === "android";

/**
 * Hide decorative nodes from assistive tech without leaking RN-only props
 * onto web DOM hosts (svg, icon glyphs, SSR, etc.).
 */
export function hideFromA11y(): HiddenA11y {
  if (!isNative) {
    return { "aria-hidden": true };
  }
  return {
    accessibilityElementsHidden: true,
    importantForAccessibility: "no-hide-descendants",
  };
}
