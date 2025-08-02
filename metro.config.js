const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

// 1. Get the default Expo Metro configuration
const config = getDefaultConfig(__dirname);

// 2. Apply Firebase-specific resolver settings BEFORE passing to withNativeWind
// These are crucial for the Firebase JS SDK to work correctly with Hermes.
config.resolver.sourceExts.push('cjs');
config.resolver.unstable_enablePackageExports = true; // Often recommended for newer setups

// 3. Wrap the modified config with NativeWind
module.exports = withNativeWind(config, { input: "./src/global.css" });