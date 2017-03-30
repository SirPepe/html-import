/* eslint-env node */

const BabiliPlugin = require("babili-webpack-plugin");
const path = require("path");

module.exports = {
  entry: "./src/html-import.js",
  output: {
    filename: "html-import.min.js",
    path: path.resolve(__dirname, "dist")
  },
  plugins: [
    new BabiliPlugin()
  ]
}