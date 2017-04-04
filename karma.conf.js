/* eslint-env node */

const webpackConfig = require("./webpack.config.js");

module.exports = function(config){
  config.set({
    frameworks: [ "mocha" ],

    files: [
      { pattern: "./node_modules/document-register-element/build/document-register-element.max.js" },
      { pattern: "./node_modules/document-register-element/build/innerHTML.max.js" },
      { pattern: "./src/html-import.js" },
      { pattern: "./test/test.js" },
      { pattern: "./test/*.html", watched: true, served:  true, included: false }
    ],

    preprocessors: {
      "src/html-import.js": [ "webpack" ],
      "test/test.js":       [ "webpack" ]
    },

    webpack: {
      plugins: webpackConfig.plugins
    },

    port: 9876,
    autoWatch: true,
    browsers: [ "Chrome", "Firefox" ],
    singleRun: false
  });
};