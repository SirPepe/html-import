import { babel } from "@rollup/plugin-babel";
import { terser } from "rollup-plugin-terser";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import license from "rollup-plugin-license";
import commonjs from "@rollup/plugin-commonjs";

const banner = {
  content:
    "<html-import> | Copyright (C) 2021 Peter Kröner | peter@peterkroener.de | Dual license GPL-3.0-only/commercial",
  commentStyle: "ignored",
};

const extensions = [".ts", ".js"];

const esmConfig = {
  external: [/@sirpepe\/oneventmixin/, /@babel\/runtime/, /core-js/],
  plugins: [
    babel({
      extensions,
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
      plugins: ["@babel/plugin-transform-runtime"],
    }),
  ],
};

const minConfig = {
  plugins: [
    nodeResolve({ extensions }),
    commonjs(),
    babel({
      extensions,
      babelHelpers: "inline",
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
      plugins: ["@babel/plugin-proposal-class-properties"],
    }),
  ],
};

export default [
  {
    input: "src/html-import.ts",
    output: {
      file: "dist/esm/html-import.js",
      format: "esm",
      plugins: [license({ banner })],
    },
    ...esmConfig,
  },
  {
    input: "src/html-import.ts",
    output: {
      file: "dist/min/html-import.min.js",
      format: "umd",
      name: "HTMLHTMLImportElement",
      plugins: [terser(), license({ banner })],
    },
    ...minConfig,
  },
];
