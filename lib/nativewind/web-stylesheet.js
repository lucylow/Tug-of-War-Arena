"use strict";

const { StyleSheet: ReactNativeStyleSheet } = require("react-native");

const documentElement = globalThis.window?.document?.documentElement;
const documentStyle =
  documentElement && typeof globalThis.window?.getComputedStyle === "function"
    ? globalThis.window.getComputedStyle(documentElement)
    : undefined;

const commonStyleSheet = {
  getFlag(name) {
    return documentStyle?.getPropertyValue(`--css-interop-${name}`);
  },
  unstable_hook_onClassName() {},
  register() {
    throw new Error("Stylesheet.register is not available on web");
  },
  registerCompiled() {
    throw new Error("Stylesheet.registerCompiled is not available on web");
  },
  getGlobalStyle() {
    throw new Error("Stylesheet.getGlobalStyle is not available on web");
  },
};

exports.StyleSheet = Object.assign({}, commonStyleSheet, ReactNativeStyleSheet);
