var FinishedPromise = require('finished-promise')
var trytryagain = require('trytryagain')

function immediately (retryOptions, fn) {
  return FinishedPromise.resolve().then(fn)
}

module.exports = {
  promise: function () {
    return this.get('immediate') ? FinishedPromise : Promise
  },

  retry: function (options, fn) {
    return this.get('immediate') ? immediately(options, fn) : trytryagain(options, fn)
  }
}
