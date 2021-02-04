import { babel } from "@rollup/plugin-babel";
import { terser } from "rollup-plugin-terser";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

const extensions = [".ts", ".js"];

const esmConfig = {
  external: [/@babel\/runtime/, /core-js/, /marked/, /html-import/],
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
      plugins: [
        "@babel/plugin-proposal-class-properties",
        "@babel/plugin-transform-runtime",
      ],
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
    output: { file: "esm/html-import.js", format: "esm" },
    ...esmConfig,
  },
  {
    input: "src/markdown-import.ts",
    output: { file: "esm/markdown-import.js", format: "esm" },
    ...esmConfig,
  },
  {
    input: "src/html-import.ts",
    output: {
      file: "dist/html-import.min.js",
      format: "iife",
      name: "HTMLHTMLImportElement",
      plugins: [terser()],
    },
    ...minConfig,
  },
  {
    input: "src/markdown-import.ts",
    output: {
      file: "dist/markdown-import.min.js",
      format: "iife",
      name: "HTMLMarkdownImportElement",
      plugins: [terser()],
    },
    ...minConfig,
  },
];
