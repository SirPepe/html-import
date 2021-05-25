module.exports = {
  parser: "@typescript-eslint/parser",

  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier/@typescript-eslint",
    "plugin:prettier/recommended",
  ],

  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    project: "./tsconfig.json",
  },

  rules: {
    "@typescript-eslint/indent": ["error", 2],
    "@typescript-eslint/object-literal-key-quotes": "off",
    "@typescript-eslint/prefer-interface": "off",
    "@typescript-eslint/no-object-literal-type-assertion": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "off",
  },

  env: {
    browser: true,
    node: true,
  }
};
