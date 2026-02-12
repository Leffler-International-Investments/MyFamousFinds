import nextConfig from "eslint-config-next";
import nextTypescript from "eslint-config-next/typescript";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextConfig,
  ...nextTypescript,
  {
    ignores: ["node_modules/", ".next/", "out/"],
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];
