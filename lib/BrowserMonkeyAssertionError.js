function BrowserMonkeyAssertionError (message, options) {
  this.message = message
  this.showDiff = true
  this.expected = options && options.expected
  this.actual = options && options.actual
  this.transforms = []

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, BrowserMonkeyAssertionError)
  } else {
    try {
      throw new Error()
    } catch (e) {
      this.stack = e.stack
    }
  }
}

BrowserMonkeyAssertionError.prototype = Object.create(Error.prototype)
BrowserMonkeyAssertionError.prototype.name = 'BrowserMonkeyAssertionError'
BrowserMonkeyAssertionError.prototype.constructor = BrowserMonkeyAssertionError

module.exports = BrowserMonkeyAssertionError
