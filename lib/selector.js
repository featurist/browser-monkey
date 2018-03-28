var extend = require('lowscore/extend')
var retry = require('trytryagain')
var BrowserMonkeyAssertionError = require('./BrowserMonkeyAssertionError')
const elementInnerText = require('./elementInnerText')
const inspect = require('object-inspect')

function Selector () {
  this._conditions = []
  this._options = {
    visibleOnly: true,
    definitions: {
      button: [
        function (name, monkey) {
          return monkey.find('button', {exactText: name})
        },
        function (name, monkey) {
          return monkey.find('input[type=button]', {exactValue: name})
        },
        function (name, monkey) {
          return monkey.find('a', {exactText: name})
        }
      ],
      field: [
        function (name, monkey) {
          return monkey.find('label', {exactText: name}).find('input')
        },
        function (name, monkey) {
          return monkey.find('input').filter(function (element) {
            var labelledBy = element.getAttribute('aria-labelledby')
            if (labelledBy) {
              var ids = labelledBy.split(/\s+/)
              var labels = ids.map(function (id) {
                return element.ownerDocument.getElementById(id)
              })
              var label = labels.filter(Boolean).map(function (l) {
                return elementInnerText(l)
              }).join(' ')
              return name === label
            }
          }, 'aria-labelledby ' + inspect({text: name}))
        }
      ]
    }
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

Selector.prototype.mapAll = function (mapper, description) {
  return this.clone(function (clone) {
    clone._conditions.push(function (elements) {
      return {
        description: description,
        value: mapper(elements)
      }
    })
  })
}

Selector.prototype.map = function (mapper, description) {
  return this.clone(function (clone) {
    clone._conditions.push(function (elements) {
      return {
        description: description,
        value: elements.map(mapper)
      }
    })
  })
}

Selector.prototype.filter = function (filter, description) {
  return this.clone(function (clone) {
    clone._conditions.push(function (elements) {
      return {
        description: description,
        value: elements.filter(filter)
      }
    })
  })
}

function subQuery (selector, queryCreator) {
  var clone = selector.clone()
  clone._conditions = []
  return queryCreator(clone)
}

Selector.prototype.anyOf = function (queryCreators) {
  var self = this

  var queries = queryCreators.map(function (queryCreator) {
    return subQuery(self, queryCreator)
  })

  return this.clone(function (clone) {
    clone._conditions.push(function (elements) {
      var accumulators = queries.map((query) => {
        return reduceTransformations(elements, query._conditions)
      })

      var value = Array.prototype.concat.apply([], accumulators.map(function (accumulator) {
        return accumulator.value
      }))

      return {
        anyOf: accumulators.map(function (accumulator) { return accumulator.transforms }),
        value: value
      }
    })
  })
}

Selector.prototype.race = function (queryCreators) {
  var self = this

  var queries = queryCreators.map(function (queryCreator) {
    return subQuery(self, queryCreator)
  })

  return this.clone(function (clone) {
    clone._conditions.push(function (elements) {
      var values = queries.map((query) => {
        try {
          return {
            value: reduceTransformations(elements, query._conditions).value
          }
        } catch (e) {
          return {
            error: e
          }
        }
      })

      if (values.some(function (v) { return !v.error })) {
        return {
          name: 'race',
          value: values.map(function (value) {
            if (value) {
              return value.value
            }
          })
        }
      } else {
        var error = new BrowserMonkeyAssertionError('all queries failed in race')
        error.transforms = [{
          raceErrors: values.map(function (value) {
            return value.error
          })
        }]
        throw error
      }
    })
  })
}

Selector.prototype.options = function (options) {
  return this.clone(function (clone) {
    extend(clone._options, options)
  })
}

function reduceTransformations (value, transformations) {
  var accumulator = {}

  function reducer (accumulator, mapper, index) {
    if (index === 0) {
      accumulator.value = value
      accumulator.transforms = []
    }
    var result = mapper(accumulator.value)
    accumulator.value = result.value
    accumulator.transforms.push(result)
    return accumulator
  }

  try {
    return transformations.reduce(reducer, accumulator)
  } catch (e) {
    if (e instanceof BrowserMonkeyAssertionError && !e.transforms) {
      e.transforms = accumulator.transforms
    }

    throw e
  }
}

Selector.prototype.then = function () {
  var self = this
  var retry = retryFromOptions(this._options)
  var originalStack = new Error().stack

  var promise = Promise.resolve(retry(function () {
    return reduceTransformations(self._value, self._conditions)
  })).then(function (accumulator) {
    return accumulator.value
  }, function (error) {
    if (error instanceof BrowserMonkeyAssertionError) {
      error.message = browserMonkeyAssertionErrorMessage(error)
      error.stack = originalStack
    }

    throw error
  })
  return promise.then.apply(promise, arguments)
}

function browserMonkeyAssertionErrorMessage (error) {
  var foundMessage = describeAccumulatedTransforms(error.transforms)
  return error.message + ' (found: ' + foundMessage + ')'
}

function describeAccumulatedTransforms (accumulatedTransforms) {
  return accumulatedTransforms.map(function (transform) {
    if (transform.anyOf instanceof Array) {
      return describeTransform({
        description: 'anyOf (' + transform.anyOf.map(describeAccumulatedTransforms).join(', or ') + ')',
        value: transform.value
      })
    } else if (transform.raceErrors instanceof Array) {
      return 'race between (' + transform.raceErrors.map(browserMonkeyAssertionErrorMessage).join(', and ') + ')'
    } else {
      return describeTransform(transform)
    }
  }).join(', ')
}

function describeTransform (transform) {
  var v = transform.value instanceof Array
    ? '[' + transform.value.length + ']'
    : '(' + typeof transform.value + ')'
  return transform.description + ' ' + v
}

Selector.prototype.catch = function (fn) {
  return this.then(undefined, fn)
}

function copySelectorFields (from, to) {
  to._conditions = from._conditions.slice()
  to._value = from._value

  to._options = extend({}, from._options)
  to._options.definitions = {}
  Object.keys(from._options.definitions).forEach(function (key) {
    to._options.definitions[key] = from._options.definitions[key].slice()
  })
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
