var BrowserMonkeyAssertionError = require('./BrowserMonkeyAssertionError')
var inspect = require('object-inspect')

module.exports = function expectEqual (actual, expected, createMessage) {
  if (actual !== expected) {
    var message = createMessage
      ? createMessage(inspect(actual), inspect(expected))
      : 'expected ' + actual + ' to equal ' + expected

    throw new BrowserMonkeyAssertionError(message, {
      actual: actual,
      expected: expected
    })
  }
}
