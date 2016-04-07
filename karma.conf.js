module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['browserify', 'mocha'],
    files: [
      'test/**/*Spec.js'
    ],
    exclude: [
    ],
    preprocessors: {
      'test/**/*Spec.js': ['browserify']
    },
    browserify: {
      debug: true,
      transform: [
        ['babelify', {
        ignore: /node_modules/
        }]
      ],
      extensions: ['.jsx']
    },
    reporters: ['progress'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: false,
    concurrency: Infinity
  })
}
