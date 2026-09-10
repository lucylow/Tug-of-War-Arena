/**
 * Companion / server runtime detection.
 *
 * This module is intentionally NOT imported by the Decentraland SDK7 scene.
 * SDK7 scenes are sandboxed and must not probe `window` or DOM APIs.
 */

import {
  canAccessInjectedEthereum,
  getRuntimeKind,
  setRuntimeKindForTests,
  type RuntimeKind as DetailedRuntimeKind,
} from "./runtime";

export type RuntimeKind = "web" | "ios" | "android" | "decentraland" | "server";

const TO_DETAILED: Record<RuntimeKind, DetailedRuntimeKind> = {
  web: "react-native-web",
  ios: "react-native-ios",
  android: "react-native-android",
  decentraland: "decentraland",
  server: "server",
};

export function setRuntimeForTests(kind: RuntimeKind | null): void {
  setRuntimeKindForTests(kind ? TO_DETAILED[kind] : null);
}

export function detectRuntime(): RuntimeKind {
  const detailed = getRuntimeKind();
  if (detailed === "react-native-ios") return "ios";
  if (detailed === "react-native-android") return "android";
  if (detailed === "decentraland") return "decentraland";
  if (detailed === "server" || detailed === "unknown") return "server";
  return "web";
}

export function isNativeRuntime(runtime: RuntimeKind = detectRuntime()): boolean {
  return runtime === "ios" || runtime === "android";
}

export function isBrowserRuntime(runtime: RuntimeKind = detectRuntime()): boolean {
  return runtime === "web";
}

export function canAccessBrowserEthereum(runtime: RuntimeKind = detectRuntime()): boolean {
  if (runtime !== "web") return false;
  return canAccessInjectedEthereum();
}

export function canUseNativeWalletBridge(runtime: RuntimeKind = detectRuntime()): boolean {
  return runtime === "ios" || runtime === "android";
}
