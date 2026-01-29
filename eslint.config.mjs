import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Define the configuration as a named variable
const eslintConfig = [
  js.configs.recommended,
  // 1. Let Next.js handle its own plugins/rules the way it expects
  ...compat.extends("next/core-web-vitals"),

  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        process: "readonly",
        console: "readonly",
        window: "readonly",
        document: "readonly",
        global: "readonly",
        React: "readonly",
        NodeJS: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "no-unused-vars": "warn",
      "@next/next/no-html-link-for-pages": "off",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    ignores: [".next/", "node_modules/", "dist/"],
  },
];

// Export the variable
export default eslintConfig;
