import { FlatCompat } from "@eslint/compat";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  // This replaces your broken import
  ...compat.extends("next/core-web-vitals"),

  {
    // Your custom rules here
    rules: {
      "no-unused-vars": "warn",
    },
  },
];
