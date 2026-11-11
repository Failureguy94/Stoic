// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", "android/*", "ios/*", "modules/*/android/build/*"],
  },
  {
    // TypeScript already checks namespace members, and this rule misreads
    // compiled enums (e.g. Notifications.AndroidImportance).
    files: ["**/*.ts", "**/*.tsx"],
    rules: { "import/namespace": "off" },
  },
]);
