import babili from "rollup-plugin-babili";

export default {
  input: "src/html-import.js",
  output: {
    format: "iife",
    file: "dist/html-import.min.js",
  },
  plugins: [
    babili({
      comments: false,
      sourceMap: false,
    }),
  ],
};