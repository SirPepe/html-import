module.exports = (config) => {
  config.set({
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
      }
    },
    reporters: ["progress", "karma-typescript"],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ["ChromeHeadless", "FirefoxHeadless"],
    singleRun: false,
  });
};
