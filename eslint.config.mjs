import js from "@eslint/js";
import globals from "globals";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/",
      "**/dist/",
      "**/coverage/",
      "apps/",
      "packages/create-kaelum/templates/",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    languageOptions: { globals: globals.node },
    rules: {
      "no-console": "off",
      "prefer-const": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_|next" }],
      // The 1.x internals lean on `any`; tightened as modules are rewritten for 2.0.
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        { "ts-nocheck": "allow-with-description", "ts-expect-error": "allow-with-description" },
      ],
    },
  },
  {
    // create-kaelum and config files are still plain CommonJS / Node scripts.
    files: ["packages/create-kaelum/**/*.js"],
    languageOptions: { sourceType: "commonjs" },
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  {
    files: ["packages/kaelum/test/**"],
    languageOptions: { globals: globals.vitest },
  },
);
