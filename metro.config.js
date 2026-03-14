// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Metro 0.83 enables package.json `exports` field resolution by default.
// Some older packages (e.g. use-latest-callback@0.2.x) expose an ESM entry
// via "exports.import" which Metro picks up, causing double-wrapping of the
// default export when required from CommonJS code. Disabling this restores
// the pre-0.83 behavior of using the `main` field (CJS) instead.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
