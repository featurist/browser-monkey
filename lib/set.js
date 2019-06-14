var inputsSelector = require('./inputsSelector')
var debug = require('debug')('browser-monkey')
var elementEnterText = require('./elementEnterText')
var elementInnerText = require('./elementInnerText')
const inspect = require('object-inspect')
const object = require('lowscore/object')
const range = require('lowscore/range')
const BrowserMonkeyAssertionError = require('./BrowserMonkeyAssertionError').default

function assertLength (query, length) {
  const actualLength = query.result().length
  if (actualLength !== length) {
    const error = query.error('expected ' + length + ' elements', { expected: length, actual: actualLength })
    error.executedTransforms.prepend(query._executedTransforms)
    throw error
  }
}

const missing = {}

function spliceModelArrayFromActual (model, query) {
  const length = query.result().length

  if (length > model.length) {
    return range(0, length).map((item, index) => {
      const modelItem = model[index]

      if (modelItem !== undefined) {
        return modelItem
      } else {
        return missing
      }
    })
  } else {
    return model.slice(0, length)
  }
}

function mapModel (query, elements, model, actions) {
  function map (query, model) {
    if (model === missing) {
      return query.result().map(e => e.innerText).join()
    } else if (model instanceof Array) {
      actions.assertLength(query, model.length)

      return spliceModelArrayFromActual(model, query).map((item, index) => {
        return map(query.index(index), item)
      })
    } else if (model.constructor === Object) {
      actions.assertLength(query, 1)
      return object(Object.entries(model).map(([selector, value]) => {
        return [selector, map(query.query(selector), value)]
      }))
    } else if (typeof model === 'function') {
      return actions.function(query, model)
    } else {
      actions.assertLength(query, 1)

      return actions.value(query, model)
    }
  }

  return map(query, model)
}

module.exports = {
  set: function (model) {
    return this.action(function (elements) {
      const setters = []

      const actions = {
        assertLength: (query, length) => {
          assertLength(query, length)
        },

        value: (query, model) => {
          var setter = query.setter().result()
          setters.push(() => setter(model))
        },
        function: (query, model) => {
          setters.push(() => model(query))
        }
      }

      const clone = this.clone().resolve()
      mapModel(clone, elements, model, actions)

      setters.forEach(set => {
        set()
      })
    })
  },

  assert: function (model) {
    return this.expect(elements => {
      let isError = false

      const catchError = returnError => (model, fn) => {
        try {
          fn()
          return model
        } catch (e) {
          if (e instanceof BrowserMonkeyAssertionError) {
            isError = true
            return returnError && e.actual === undefined ? e : e.actual
          } else {
            throw e
          }
        }
      }

      const catchFunctionError = catchError(true)
      const catchValueError = catchError(false)

      const actions = {
        assertLength: (query, length) => {
          const actualLength = query.result().length
          if (actualLength !== length) {
            isError = true
          }
        },

        value: (query, model) => {
          try {
            var asserter = query.asserter().result()
            asserter(model)
            return model
          } catch (e) {
            if (e instanceof BrowserMonkeyAssertionError) {
              isError = true
              return e.actual
            } else {
              throw e
            }
          }
        },

        function: (query, model) => {
          try {
            model(query)
            return model
          } catch (e) {
            if (e instanceof BrowserMonkeyAssertionError) {
              isError = true
              return e.actual === undefined ? e : e.actual
            } else {
              throw e
            }
          }
        }
      }

      const clone = this.clone().resolve()
      const result = mapModel(clone, elements, model, actions)

      if (isError) {
        this.error('could not match', {expected: model, actual: result})
      }
    })
  },

  index: function (index) {
    return this.transform(function (elements) {
      return [elements[index]]
    }, 'index ' + index)
  },

  length: function (length) {
    return this.expect(function (results) {
      const actualLength = results.length
      if (actualLength !== length) {
        this.error('expected ' + length + ' elements', { expected: length, actual: actualLength })
      }
    })
  },

  define: function (name, fieldFinder) {
    this._options.definitions.fields[name] = fieldFinder
  },

  defineFinder: function (name, finder) {
    this._options.definitions.finders[name] = finder
  },

  setter: function () {
    return this.firstOf(this._options.definitions.setters)
  },

  asserter: function () {
    return this.firstOf(this._options.definitions.asserters)
  },

  installSetters: function () {
    this._options.definitions.setters = [
      query => {
        return query.is(inputsSelector).expectOneElement().transform(([element]) => {
          return text => {
            if (typeof text !== 'string') {
              throw new Error('expected string as argument to set input')
            }
            debug('set', element, text)
            elementEnterText(element, text)
          }
        })
      }
    ]

    this._options.definitions.asserters = [
      query => {
        return query.find('input').expectOneElement().transform(([input]) => {
          return expected => {
            const actual = input.value
            if (actual !== expected) {
              this.error('expected ' + inspect(actual) + ' to equal ' + inspect(expected), { actual, expected })
            }
          }
        })
      },
      query => {
        return query.expectOneElement().transform(([element]) => {
          return expected => {
            const actual = elementInnerText(element)
            if (actual !== expected) {
              this.error('expected ' + inspect(actual) + ' to equal ' + inspect(expected), { actual, expected })
            }
          }
        })
      }
    ]

    this._options.definitions.finders.css = function (query, css) {
      return query.css(css)
    }

    return this
  }
}
