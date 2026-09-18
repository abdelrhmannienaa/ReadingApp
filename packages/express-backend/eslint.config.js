import js from "@eslint/js";

export default [
  { ignores: ["dist", "node_modules"] },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2020,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    rules: {
      ...js.configs.recommended.rules,
    },
  },
];