var BrowserMonkeyAssertionError = require('./BrowserMonkeyAssertionError')
var deepEqual = require('deep-equal')
var inspect = require('object-inspect')

module.exports = function expectDeepEqual (actual, expected, createMessage) {
  if (!deepEqual(actual, expected)) {
    var message = createMessage
      ? createMessage(inspect(actual), inspect(expected))
      : 'expected ' + actual + ' to deeply equal ' + expected

    throw new BrowserMonkeyAssertionError(message, {
      actual: actual,
      expected: expected
    })
  }
}
