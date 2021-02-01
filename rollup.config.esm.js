import { babel } from "@rollup/plugin-babel";

export default {
  input: "src/html-import.ts",
  output: {
    file: "esm/html-import.js",
    format: "esm",
  },
  external: [/@babel\/runtime/, /core-js/],
  plugins: [
    babel({
      extensions: [".js", ".ts"],
      babelHelpers: "runtime",
      exclude: "node_modules/**",
      presets: [
        [
          "@babel/preset-env",
          {
            targets: "defaults,not ie 11",
            useBuiltIns: "usage",
            corejs: "3.8",
          },
        ],
        "@babel/preset-typescript",
      ],
      plugins: ["@babel/plugin-proposal-class-properties", "@babel/plugin-transform-runtime"],
    }),
  ],
};
