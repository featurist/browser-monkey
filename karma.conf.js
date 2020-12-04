const webpackConfig = require("./webpack.config");

const files = [
  {pattern: "test/*.html", included: false},
  "test/**/*Spec.ts",
]

const browserstackBrowsers = {
  'browserstack-windows-firefox': {
    base: 'BrowserStack',
    browser: 'Firefox',
    os: 'Windows',
    os_version: '10',
    resolution: '1280x1024'
  },
  'browserstack-osx-firefox': {
    base: 'BrowserStack',
    browser: 'Firefox',
    os: 'OS X',
    os_version: 'Mojave',
    resolution: '1280x1024'
  },
  'browserstack-safari': {
    base: 'BrowserStack',
    browser: 'Safari',
    os: 'OS X',
    os_version: 'Mojave',
    resolution: '1280x1024'
  },
  'browserstack-windows-chrome': {
    base: 'BrowserStack',
    browser: 'Chrome',
    os: 'Windows',
    os_version: '10',
    resolution: '1280x1024'
  },
  'browserstack-osx-chrome': {
    base: 'BrowserStack',
    browser: 'Chrome',
    os: 'OS X',
    os_version: 'Mojave',
    resolution: '1280x1024'
  },
  'browserstack-edge': {
    base: 'BrowserStack',
    browser: 'Edge',
    os: 'Windows',
    os_version: '10',
    resolution: '1280x1024'
  }
}

module.exports = function(config) {
  const browser = process.env.BROWSER || 'Chrome'

  const browsers = process.env.BROWSERS === 'all' ? Object.keys(browserstackBrowsers) : [
    config.singleRun ? browser + 'Headless' : browser
  ]

  config.set({
    basePath: "",
    frameworks: ["mocha"],
    files,
    exclude: [],
    preprocessors: {
      "test/**/*.{ts,js,jsx,tsx}": ["webpack", "sourcemap"]
    },
    webpack: webpackConfig,
    reporters: ["progress"],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    singleRun: false,
    concurrency: Infinity,
    browsers,
    browserStack: {
      username: process.env.BROWSERSTACK_USER,
      accessKey: process.env.BROWSERSTACK_PASSWORD
    },

    customLaunchers: browsers,
    browserNoActivityTimeout: 120000,
    browserDisconnectTimeout: 120000,
    browserDisconnectTolerance: 3,
  });
};
