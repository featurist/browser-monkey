var BrowserMonkeyAssertionError = require('./BrowserMonkeyAssertionError')

module.exports = function (error) {
  return function (e) {
    if (e instanceof BrowserMonkeyAssertionError) {
      e.stack = error.stack
    }
    throw e
  }
}
