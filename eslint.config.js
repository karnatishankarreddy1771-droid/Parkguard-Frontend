import js from "@eslint/js";
import globals from "globals";
import hooks from "eslint-plugin-react-hooks";
import refresh from "eslint-plugin-react-refresh";

export default [
  { ignores: ["dist/**", "node_modules/**", ".vite-runtime-cache/**"] },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: globals.browser,
    },
    plugins: { "react-hooks": hooks, "react-refresh": refresh },
    rules: {
      ...js.configs.recommended.rules,
      ...hooks.configs.flat.recommended.rules,
      "no-unused-vars": ["error", { varsIgnorePattern: "^[A-Z_]", argsIgnorePattern: "^_" }],
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },
];
