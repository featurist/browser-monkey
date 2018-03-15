var extend = require('lowscore/extend')
var retry = require('trytryagain')
var BrowserMonkeyAssertionError = require('./BrowserMonkeyAssertionError')

function Selector () {
  this._conditions = []
  this._options = {
    visibleOnly: true
  }
  this._value = undefined
}

function retryFromOptions (options) {
  if (options && (options.timeout || options.interval)) {
    return function (fn) {
      return retry(fn, options)
    }
  } else if (options && options.retry) {
    return options.retry
  } else {
    return retry
  }
}

Selector.prototype.mapAll = function (mapper, name) {
  return this.clone(function (clone) {
    clone._conditions.push({
      name: name,
      map: mapper
    })
  })
}

Selector.prototype.map = function (mapper, name) {
  return this.clone(function (clone) {
    clone._conditions.push({
      name: name,
      map: function (elements) {
        return elements.map(mapper)
      }
    })
  })
}

Selector.prototype.filter = function (filter, name) {
  return this.clone(function (clone) {
    clone._conditions.push({
      name: name,
      map: function (elements) {
        return elements.filter(filter)
      }
    })
  })
}

Selector.prototype.options = function (options) {
  return this.clone(function (clone) {
    clone._options = extend({}, clone._options, options)
  })
}

Selector.prototype.then = function () {
  var self = this
  var retry = retryFromOptions(this._options)
  var accumulator = {}
  var originalStack = new Error().stack

  function reducer (accumulator, mapper, index) {
    if (index === 0) {
      accumulator.value = self._value
      accumulator.transforms = []
    }
    accumulator.value = mapper.map(accumulator.value)
    accumulator.transforms.push({
      value: accumulator.value,
      name: mapper.name
    })
    return accumulator
  }

  var promise = Promise.resolve(retry(function () {
    return self._conditions.reduce(reducer, accumulator)
  })).then(function (accumulator) {
    return accumulator.value
  }, function (error) {
    if (error instanceof BrowserMonkeyAssertionError) {
      var foundMessage = accumulator.transforms.map(function (transform) {
        var v = transform.value instanceof Array
          ? '[' + transform.value.length + ']'
          : '(' + typeof transform.value + ')'
        return transform.name + ' ' + v
      }).join(', ')
      error.message = error.message + ' (found: ' + foundMessage + ')'
      error.stack = originalStack
    }

    throw error
  })
  return promise.then.apply(promise, arguments)
}

Selector.prototype.catch = function (fn) {
  return this.then(undefined, fn)
}

function copySelectorFields (from, to) {
  to._conditions = from._conditions.slice()
  to._value = from._value
  to._options = from._options
}

Selector.prototype.clone = function (modifier) {
  var clone = new this.constructor()
  copySelectorFields(this, clone)
  if (modifier) {
    modifier(clone)
  }
  return clone
}

Selector.prototype.ensure = function (assertion, name) {
  return this.mapAll(value => {
    assertion(value)
    return value
  }, name || 'ensure')
}

Selector.prototype.zero = function () {
  return this.mapAll(results => {
    if (results instanceof Array) {
      if (results.length !== 0) {
        throw new BrowserMonkeyAssertionError('expected no elements')
      } else {
        return results
      }
    } else {
      return results
    }
  }, 'zero')
}

Selector.prototype.one = function () {
  return this.mapAll(results => {
    if (results instanceof Array) {
      if (results.length === 1) {
        return results[0]
      } else {
        throw new BrowserMonkeyAssertionError('expected one element')
      }
    } else {
      return results
    }
  }, 'one')
}

Selector.prototype.some = function () {
  return this.mapAll(results => {
    if (results instanceof Array && results.length !== 0) {
      return results
    } else {
      throw new BrowserMonkeyAssertionError('expected some elements')
    }
  }, 'some')
}

Selector.prototype.value = function (value) {
  return this.clone(function (clone) {
    clone._value = value
  })
}

Selector.prototype.component = function (methods) {
  var self = this

  function Component () {
    copySelectorFields(self, this)
  }

  Component.prototype = new this.constructor()
  Object.keys(methods).forEach(function (method) {
    Component.prototype[method] = methods[method]
  })
  Component.prototype.constructor = Component

  return new Component()
}

module.exports = Selector
