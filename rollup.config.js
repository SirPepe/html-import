import { babel } from "@rollup/plugin-babel";
import { terser } from "rollup-plugin-terser";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

const esmConfig = {
  external: [/@babel\/runtime/, /core-js/, /marked/],
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
      plugins: [
        "@babel/plugin-proposal-class-properties",
        "@babel/plugin-transform-runtime",
      ],
    }),
  ],
};

const minConfig = {
  plugins: [
    nodeResolve(),
    commonjs(),
    babel({
      extensions: [".js", ".ts"],
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
    output: { file: "esm/html-import.js", format: "esm" },
    ...esmConfig,
  },
  {
    input: "src/html-import-markdown.ts",
    output: { file: "esm/html-import-markdown.js", format: "esm" },
    ...esmConfig,
  },
  {
    input: "src/html-import.ts",
    output: {
      file: "dist/html-import.min.js",
      format: "iife",
      name: "HTMLImportHTMLElement",
      plugins: [terser()],
    },
    ...minConfig,
  },
  {
    input: "src/html-import-markdown.ts",
    output: {
      file: "dist/html-import-markdown.min.js",
      format: "iife",
      plugins: [terser()],
    },
    ...minConfig,
  },
];
