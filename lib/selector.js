var extend = require('lowscore/extend')
var retry = require('trytryagain')
var BrowserMonkeyAssertionError = require('./BrowserMonkeyAssertionError')
var elementInnerText = require('./elementInnerText')
var inspect = require('object-inspect')
var uniq = require('lowscore/uniq')
var debug = require('debug')('browser-monkey')

function Selector () {
  this._conditions = []
  this._options = {
    visibleOnly: true,
    timeout: 1000,
    interval: 10,
    definitions: {
      button: [
        function (monkey, name) {
          return monkey.find('button', {exactText: name})
        },
        function (monkey, name) {
          return monkey.find('input[type=button]', {exactValue: name})
        },
        function (monkey, name) {
          return monkey.find('a', {exactText: name})
        }
      ],
      field: [
        function (monkey, name) {
          return monkey.find('label', {exactText: name}).find('input')
        },
        function (monkey, name) {
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
      ],
      fieldValue: [
        {
          set: function (monkey, value) {
            return monkey.typeIn(value)
          },
          get: function (monkey) {
            return monkey.inputValue()
          }
        },
        {
          set: function (monkey, value) {
            return monkey.select(value)
          },
          get: function (monkey) {
            return monkey.selectValue()
          }
        },
        {
          set: function (monkey, value) {
            return monkey.check(value)
          },
          get: function (monkey) {
            return monkey.checked()
          }
        }
      ]
    }
  }
  this._value = undefined
}

Selector.prototype.action = function (action) {
  return this.clone(function (clone) {
    if (clone._action) {
      throw new Error('can only have one action')
    }
    clone._action = action
  })
}

function retryFromOptions (options) {
  if (options && options.retry) {
    return options.retry
  } else if (options && (options.timeout || options.interval)) {
    return function (fn) {
      return retry(fn, options)
    }
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

Selector.prototype.all = function (queryCreators) {
  var self = this

  var queries = queryCreators.map(function (queryCreator) {
    return self.subQuery(queryCreator)
  })

  return this.clone(function (clone) {
    clone._conditions.push(function (elements) {
      var accumulators = queries.map(function (query) {
        return query.resolve(elements)
      })

      var value = uniq(Array.prototype.concat.apply([], accumulators.map(function (accumulator) {
        return accumulator.value
      })))

      return {
        all: accumulators.map(function (accumulator) { return accumulator.transforms }),
        value: value
      }
    })
  })
}

Selector.prototype.subQuery = function (createQuery) {
  var clone = this.clone()
  clone._conditions = []
  var query = createQuery(clone)
  if (!(query instanceof Selector)) {
    throw new Error('expected to create query: ' + createQuery)
  }
  return query
}

Selector.prototype.resolveSubQuery = function (createQuery, value) {
  return this.subQuery(createQuery).resolve(value)
}

Selector.prototype.resolve = function (value, options) {
  var accumulator = {}
  var includeScope = options && options.hasOwnProperty('includeScope') && options.includeScope !== undefined
    ? options.includeScope
    : false

  function reducer (accumulator, mapper, index) {
    if (index === 0) {
      accumulator.value = value
      accumulator.transforms = []

      if (includeScope) {
        accumulator.transforms.push({
          description: 'scope',
          value: value
        })
      }
    }
    var result = mapper(accumulator.value)
    accumulator.value = result.value
    accumulator.transforms.push(result)
    return accumulator
  }

  try {
    var queryResult = this._conditions.reduce(reducer, accumulator)
    if (this._action && !this._actionExecuted) {
      this._action(queryResult.value)
      this._actionExecuted = true
    }
    return queryResult
  } catch (e) {
    if (e instanceof BrowserMonkeyAssertionError) {
      e.transforms.unshift.apply(e.transforms, accumulator.transforms)
    }

    throw e
  }
}

Selector.prototype.race = function (queryCreators) {
  var self = this

  var queries = queryCreators.map(function (queryCreator) {
    return self.subQuery(queryCreator)
  })

  return this.clone(function (clone) {
    clone._conditions.push(function (elements) {
      var values = queries.map(function (query) {
        try {
          return {
            value: query.resolve(elements).value
          }
        } catch (e) {
          return {
            error: e
          }
        }
      })

      var firstSuccess = values.find(function (v) {
        return !v.error
      })
      if (firstSuccess) {
        return {
          name: 'race',
          value: firstSuccess.value
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
  if (options) {
    return this.clone(function (clone) {
      extend(clone._options, options)
    })
  } else {
    return this._options
  }
}

Selector.prototype.then = function () {
  var self = this
  var retry = retryFromOptions(this._options)
  var originalStack = new Error().stack

  var promise = Promise.resolve(retry(function () {
    return self.resolve(self._value, {includeScope: true}).value
  })).catch(function (error) {
    if (error instanceof BrowserMonkeyAssertionError) {
      error.message = browserMonkeyAssertionErrorMessage(error)
      error.stack = originalStack

      if (debug.enabled) {
        debug('assertion error', error.message)
        error.transforms.forEach(function (transform) {
          debug('found: ' + transform.description, transform.value)
        })
      }
    }

    throw error
  })
  return promise.then.apply(promise, arguments)
}

function errorMessage (error) {
  if (error instanceof BrowserMonkeyAssertionError) {
    return browserMonkeyAssertionErrorMessage(error)
  } else {
    return error.message
  }
}

function browserMonkeyAssertionErrorMessage (error) {
  var foundMessage = describeAccumulatedTransforms(error.transforms)
  return error.message + ' (found: ' + foundMessage + ')'
}

function describeAccumulatedTransforms (accumulatedTransforms) {
  return accumulatedTransforms.map(function (transform) {
    if (transform.all instanceof Array) {
      return describeTransform({
        description: 'all (' + transform.all.map(describeAccumulatedTransforms).join(', or ') + ')',
        value: transform.value
      })
    } else if (transform.raceErrors instanceof Array) {
      return 'race between (' + transform.raceErrors.map(errorMessage).join(', and ') + ')'
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

Selector.prototype.input = function (value) {
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
    var descriptor = Object.getOwnPropertyDescriptor(methods, method)
    if (descriptor) {
      Object.defineProperty(Component.prototype, method, descriptor)
    } else {
      Component.prototype[method] = methods[method]
    }
  })
  Component.prototype.constructor = Component

  return new Component()
}

module.exports = Selector
