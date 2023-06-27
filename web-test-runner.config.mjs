import { readFileSync } from "fs";
import { fromRollup } from "@web/dev-server-rollup";
import { babel } from "@rollup/plugin-babel";
import { nodeResolve } from "@rollup/plugin-node-resolve";

const extensions = [".ts", ".js"];

const babelConfig = JSON.parse(
  readFileSync("./babel.config.json", { encoding: "utf8" })
);

const babelPlugin = fromRollup(babel);
const nodeResolvePlugin = fromRollup(nodeResolve);

export default {
  mimeTypes: {
    "**/*.ts": "js",
  },
  plugins: [
    nodeResolvePlugin({ extensions }),
    babelPlugin({
      extensions,
      ...babelConfig,
      babelHelpers: "bundled",
      exclude: "node_modules/**",
    }),
  ],
};
