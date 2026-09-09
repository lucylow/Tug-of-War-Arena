const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);
const emptyModule = path.resolve(__dirname, "lib/web3/empty-module.js");

config.resolver.sourceExts = [...config.resolver.sourceExts, "cjs"];
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  stream: require.resolve("readable-stream"),
  crypto: emptyModule,
  http: emptyModule,
  https: emptyModule,
  net: emptyModule,
  tls: emptyModule,
  zlib: emptyModule,
};

const metroConfig = withNativeWind(config, {
  input: "./global.css",
  // Force write CSS to file system instead of virtual modules
  // This fixes iOS styling issues in development mode
  forceWriteFileSystem: true,
});

const cssInteropStylesheet = path.resolve(__dirname, "lib/nativewind/web-stylesheet.js");
const cssInteropColorScheme = path.resolve(__dirname, "lib/nativewind/web-color-scheme.js");
const defaultResolveRequest = metroConfig.resolver.resolveRequest;

metroConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  const origin = typeof context.originModulePath === "string" ? context.originModulePath.replace(/\\/g, "/") : "";
  const isCssInteropWeb =
    origin.includes("react-native-css-interop") && origin.includes("/runtime/web/");
  const isStylesheet = moduleName === "./stylesheet" || moduleName === "./stylesheet.js" || /react-native-css-interop.*stylesheet/.test(moduleName);
  const isColorScheme = moduleName === "./color-scheme" || moduleName === "./color-scheme.js";

  if (isCssInteropWeb && isStylesheet) {
    return { type: "sourceFile", filePath: cssInteropStylesheet };
  }
  if (isCssInteropWeb && isColorScheme) {
    return { type: "sourceFile", filePath: cssInteropColorScheme };
  }

  if (typeof defaultResolveRequest === "function") {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = metroConfig;
