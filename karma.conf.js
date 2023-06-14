/* eslint-env node */

module.exports = (config) => {
  config.set({
    // The custom launcher is a workaround for Firefox installed with snap on
    // Ubuntu, see https://github.com/karma-runner/karma-firefox-launcher/issues/183
    customLaunchers: {
      FirefoxCustom: {
        base: "Firefox",
        flags: ["-headless"],
        profile: module.require("path").join(__dirname, "tmp"),
      },
    },
    basePath: "",
    frameworks: ["jasmine", "karma-typescript"],
    files: [
      {
        pattern: "test/*.ts",
        watched: true,
      },
      {
        pattern: "src/**/*.ts",
        watched: true,
      },
      {
        pattern: "test/resources/**/*.*",
        watched: true,
        included: false,
        served: true,
        nocache: false,
      },
    ],
    preprocessors: {
      "**/*.ts": "karma-typescript",
    },
    karmaTypescriptConfig: {
      compilerOptions: {
        target: "ES2015",
        allowSyntheticDefaultImports: true,
      },
    },
    reporters: ["progress", "karma-typescript"],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ["ChromeHeadless", "FirefoxCustom"],
    singleRun: false,
  });
};
