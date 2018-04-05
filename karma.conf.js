module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['browserify', 'mocha', 'server-side'],
    files: [
      'test/global.js',
      'test/**/*Spec.js',
      'test/page1.html',
      'test/page2.html'
    ],
    exclude: [
      '**/*.sw?'
    ],
    preprocessors: {
      'test/global.js': ['browserify', 'env'],
      'test/**/*Spec.js': ['browserify']
    },

    envPreprocessor: [
      'BM_TIMEOUT'
    ],

    browserify: {
      debug: true,
      extensions: ['.jsx'],
      transform: ['babelify', [require('./utils/removeStrictFromSend'), {global: true}]]
    },

    client: {
      mocha: {
        timeout: 0
      }
    },
    reporters: process.env.BROWSERS ? ['dots'] : ['mocha'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: process.env.BROWSERS === 'all' ? Object.keys(browsers) : ['Chrome'],

    browserStack: {
      username: process.env.BROWSERSTACK_USER,
      accessKey: process.env.BROWSERSTACK_PASSWORD
    },
    singleRun: false,
    customLaunchers: browsers,
    browserNoActivityTimeout: 120000,
    browserDisconnectTimeout: 120000,
    browserDisconnectTolerance: 3,

    proxies: {
      '/iframe-test/': 'http://localhost:4572/'
    }
  })
}

var browsers = {
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
    os_version: 'Sierra',
    resolution: '1280x1024'
  },
  'browserstack-safari': {
    base: 'BrowserStack',
    browser: 'Safari',
    os: 'OS X',
    os_version: 'Sierra',
    resolution: '1280x1024'
  },
  'browserstack-safari-ios': {
    base: 'BrowserStack',
    device: 'iPhone 6S',
    os: 'ios'
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
    os_version: 'Sierra',
    resolution: '1280x1024'
  },
  'browserstack-ie9': {
    base: 'BrowserStack',
    browser: 'IE',
    browser_version: '9.0',
    os: 'Windows',
    os_version: '7',
    resolution: '1280x1024'
  },
  'browserstack-ie10': {
    base: 'BrowserStack',
    browser: 'IE',
    browser_version: '10.0',
    os: 'Windows',
    os_version: '8',
    resolution: '1280x1024'
  },
  'browserstack-ie11': {
    base: 'BrowserStack',
    browser: 'IE',
    browser_version: '11.0',
    os: 'Windows',
    os_version: '10',
    resolution: '1280x1024'
  },
  'browserstack-edge': {
    base: 'BrowserStack',
    browser: 'Edge',
    browser_version: '13.0',
    os: 'Windows',
    os_version: '10',
    resolution: '1280x1024'
  }
}
