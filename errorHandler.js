function BrowserMonkeyError (message, stack) {
  this.name = 'BrowserMonkeyError'
  this.message = message
  this.stack = stack
}
BrowserMonkeyError.prototype = Object.create(Error.prototype)
BrowserMonkeyError.prototype.constructor = BrowserMonkeyError

module.exports = function (error) {
  return function (e) {
    var bmError = new BrowserMonkeyError(e.message, error.stack)
    // bmError.internalError = e;
    throw bmError
  }
}
