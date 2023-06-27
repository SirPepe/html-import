import { readFileSync } from "fs";
import { babel } from "@rollup/plugin-babel";
import terser from "@rollup/plugin-terser";
import { nodeResolve } from "@rollup/plugin-node-resolve";

const extensions = [".ts", ".js"];

const babelConfig = JSON.parse(
  readFileSync("./babel.config.json", { encoding: "utf8" })
);

const commonConfig = {
  plugins: [
    nodeResolve({ extensions }),
    babel({
      extensions,
      ...babelConfig,
      babelHelpers: "bundled",
      exclude: "node_modules/**",
    }),
  ],
};

export default [
  {
    input: "src/html-import.ts",
    output: {
      file: "dist/esm/html-import.js",
      format: "esm",
    },
    external: ["@sirpepe/schleifchen"],
    ...commonConfig,
  },
  {
    input: "src/html-import.ts",
    output: {
      file: "dist/min/html-import.min.js",
      format: "umd",
      name: "HTMLImportElement",
      plugins: [terser()],
    },
    ...commonConfig,
  },
];
