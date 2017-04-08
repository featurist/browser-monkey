require('lie/polyfill')

var expect = require('chai').expect
global.timeout = parseInt(typeof window === 'object' && (window.__env__.BM_TIMEOUT || 200))

Promise.prototype.assertStackTrace = function (file) { // eslint-disable-line
  return this.then(function () {
    throw new Error('This test should have thrown an error but did not. You need to fix this.')
  }).catch(function (error) {
    var specLine = error.stack.split('\n').find(function (line) {
      return line.indexOf(file) !== -1
    })

    expect(specLine).to.include(file)
  })
}
