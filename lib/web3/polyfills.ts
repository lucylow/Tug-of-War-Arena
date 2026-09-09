import { Buffer } from "buffer";
import "react-native-get-random-values";
import "react-native-url-polyfill/auto";

const globalObject = globalThis as typeof globalThis & {
  Buffer?: typeof Buffer;
  window?: Window & typeof globalThis;
  crypto?: Crypto;
};

if (typeof globalObject.Buffer === "undefined") {
  globalObject.Buffer = Buffer;
}

type LocationShim = { hostname: string; href: string };
type ComputedStyleShim = { getPropertyValue: (name: string) => string };
type ClassListShim = {
  contains: (token: string) => boolean;
  add: (...tokens: string[]) => void;
  remove: (...tokens: string[]) => void;
  toggle: (token: string) => boolean;
};
type DocumentElementShim = {
  classList: ClassListShim;
  style: Record<string, string>;
};
type DocumentShim = {
  documentElement: DocumentElementShim;
  head: Record<string, unknown>;
  body: Record<string, unknown>;
  getElementsByTagName: (tag: string) => unknown[];
  querySelector: (selector: string) => null;
  querySelectorAll: (selector: string) => unknown[];
  createElement: (tag: string) => Record<string, unknown>;
};
type WindowShim = {
  location: LocationShim;
  document?: DocumentShim;
  getComputedStyle?: (element?: unknown) => ComputedStyleShim;
  matchMedia?: (query: string) => { matches: boolean; addEventListener: () => void; removeEventListener: () => void };
  addEventListener: (...args: unknown[]) => void;
  removeEventListener: (...args: unknown[]) => void;
  dispatchEvent: (...args: unknown[]) => boolean;
  Event?: unknown;
  CustomEvent?: unknown;
};

const emptyComputedStyle: ComputedStyleShim = {
  getPropertyValue: () => "",
};

const emptyClassList: ClassListShim = {
  contains: () => false,
  add: () => undefined,
  remove: () => undefined,
  toggle: () => false,
};

const emptyDocumentElement: DocumentElementShim = {
  classList: emptyClassList,
  style: {},
};

const emptyHead: Record<string, unknown> = {};

function createDocumentShim(): DocumentShim {
  return {
    documentElement: emptyDocumentElement,
    head: emptyHead,
    body: {},
    getElementsByTagName: (tag: string) => {
      if (tag === "head") return [emptyHead];
      if (tag === "html") return [emptyDocumentElement];
      return [];
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({ style: {}, classList: emptyClassList, setAttribute() {}, getAttribute() { return null; } }),
  };
}

class MutationObserverShim {
  observe(): void {}
  disconnect(): void {}
  takeRecords(): unknown[] {
    return [];
  }
}

if (typeof (globalObject as { MutationObserver?: unknown }).MutationObserver === "undefined") {
  (globalObject as { MutationObserver?: unknown }).MutationObserver = MutationObserverShim;
}

const existingWindow = (globalObject.window ??
  (typeof window !== "undefined" ? window : undefined)) as unknown as WindowShim | undefined;
const windowObj: WindowShim = existingWindow ?? {
  location: {
    hostname: "tugofwar.example.com",
    href: "https://tugofwar.example.com",
  },
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  dispatchEvent: () => true,
};

if (!windowObj.location) {
  windowObj.location = {
    hostname: "tugofwar.example.com",
    href: "https://tugofwar.example.com",
  };
}
if (typeof windowObj.addEventListener !== "function") {
  windowObj.addEventListener = () => undefined;
}
if (typeof windowObj.removeEventListener !== "function") {
  windowObj.removeEventListener = () => undefined;
}
if (typeof windowObj.dispatchEvent !== "function") {
  windowObj.dispatchEvent = () => true;
}
if (!windowObj.document?.documentElement || typeof windowObj.document.getElementsByTagName !== "function") {
  windowObj.document = createDocumentShim();
}
if (typeof windowObj.getComputedStyle !== "function") {
  windowObj.getComputedStyle = () => emptyComputedStyle;
}
if (typeof windowObj.matchMedia !== "function") {
  windowObj.matchMedia = () => ({
    matches: false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  });
}

if (!globalObject.window) {
  globalObject.window = windowObj as unknown as Window & typeof globalThis;
}
