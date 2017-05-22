import babili from "rollup-plugin-babili";

export default {
  entry: "src/html-import.js",
  format: "iife",
  plugins: [
    babili({
      comments: false,
      sourceMap: false,
    }),
  ],
  dest: "dist/html-import.min.js",
};