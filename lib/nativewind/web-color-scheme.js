"use strict";

const { Appearance, AppState } = require("react-native");
const { INTERNAL_RESET } = require("react-native-css-interop/dist/shared");
const { observable } = require("react-native-css-interop/dist/runtime/observable");
const { StyleSheet } = require("./web-stylesheet");

let appearance = Appearance;
let appearanceListener;
const darkModeFlag = StyleSheet.getFlag("darkMode");
let darkMode;
let darkModeValue;
let initialColor = undefined;

const documentRef = () => globalThis.window?.document;

if (darkModeFlag) {
  const flags = darkModeFlag.split(" ");
  darkMode = flags[0];
  darkModeValue = flags[1];
  if (darkMode === "class") {
    initialColor = documentRef()?.documentElement?.classList?.contains(darkModeValue) ? "dark" : "light";
  }
} else {
  const headNode = documentRef()?.getElementsByTagName?.("head")?.[0];
  if (headNode && typeof MutationObserver === "function") {
    new MutationObserver(function (_, observer) {
      const nextFlag = StyleSheet.getFlag("darkMode");
      if (!nextFlag) return;
      observer.disconnect();
      const flags = nextFlag.split(" ");
      darkMode = flags[0];
      darkModeValue = flags[1];
      exports.colorScheme.set(
        documentRef()?.documentElement?.classList?.contains(darkModeValue) ? "dark" : "system",
      );
    }).observe(headNode, { attributes: false, childList: true, subtree: false });
  }
}

const systemColorScheme = observable(appearance.getColorScheme() ?? "light");
const colorSchemeObservable = observable(initialColor, { fallback: systemColorScheme });

exports.colorScheme = {
  set(value) {
    if (darkMode === "media") {
      throw new Error("Cannot manually set color scheme, as dark mode is type 'media'. Please use StyleSheet.setFlag('darkMode', 'class')");
    }
    if (!globalThis.window) {
      throw new Error("Cannot manually set color scheme while not in a browser environment.");
    }
    if (value === "system") {
      colorSchemeObservable.set(undefined);
    } else {
      colorSchemeObservable.set(value);
    }
    if (darkModeValue) {
      if (value === "dark") {
        documentRef()?.documentElement?.classList?.add(darkModeValue);
      } else {
        documentRef()?.documentElement?.classList?.remove(darkModeValue);
      }
    }
  },
  get: colorSchemeObservable.get,
  toggle() {
    let current = colorSchemeObservable.get();
    if (current === undefined) current = appearance.getColorScheme() ?? "light";
    exports.colorScheme.set(current === "light" ? "dark" : "light");
  },
  [INTERNAL_RESET]: (nextAppearance) => {
    colorSchemeObservable.set(undefined);
    resetAppearanceListeners(nextAppearance);
  },
};

function resetAppearanceListeners($appearance) {
  appearance = $appearance;
  appearanceListener?.remove();
  appearanceListener = appearance.addChangeListener((state) => {
    if (AppState.currentState === "active") {
      systemColorScheme.set(state.colorScheme ?? "light");
    }
  });
}

resetAppearanceListeners(appearance);
