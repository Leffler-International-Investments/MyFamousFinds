// @ts-check

const next = require("eslint-config-next");

module.exports = [
  {
    files: ["**/*.js", "**/*.mjs", "**/*.cjs", "**/*.ts", "**/*.tsx"],
    ...next,
  },
  {
    // Ignores are essential for performance
    ignores: [
      ".next/**",
      "node_modules/**",
      "build/**",
      "dist/**",
    ],
  },
];
