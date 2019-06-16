var inputsSelector = require('./inputsSelector')
var debug = require('debug')('browser-monkey')
var elementEnterText = require('./elementEnterText')
var elementInnerText = require('./elementInnerText')
var elementSelect = require('./elementSelect')
const inspect = require('object-inspect')
const object = require('lowscore/object')
const range = require('lowscore/range')
const pluralize = require('pluralize')
const BrowserMonkeyAssertionError = require('./BrowserMonkeyAssertionError').default

function assertLength (query, length) {
  query.expect(elements => {
    const actualLength = elements.length
    if (actualLength !== length) {
      const error = query.error('expected ' + length + ' ' + pluralize('elements', length) + ', found ' + actualLength, { expected: length, actual: actualLength })
      error.executedTransforms.prepend(query._executedTransforms)
      throw error
    }
  }).result()
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

function mapModel (query, model, actions) {
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
        return [selector, map(query.find(selector), value)]
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
          var setter = query.setter(model).result()
          setters.push(() => setter())
        },

        function: (query, model) => {
          setters.push(() => model(query))
        }
      }

      const clone = this.resolve(elements)
      mapModel(clone, model, actions)

      setters.forEach(set => {
        set()
      })
    })
  },

  assert: function (model) {
    return this.expect(elements => {
      let isError = false

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

      const clone = this.resolve(elements)
      const result = mapModel(clone, model, actions)

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

  define: function (name, fieldFinder) {
    this._options.definitions.fields[name] = fieldFinder
  },

  defineFinder: function (name, finder) {
    this._options.definitions.finders[name] = finder
  },

  setter: function (model) {
    return this.firstOf(this._options.definitions.setters.map(s => s(model)))
  },

  asserter: function () {
    return this.firstOf(this._options.definitions.asserters)
  },

  installSetters: function () {
    this._options.definitions.setters = [
      model => query => {
        return query.is(inputsSelector).expectOneElement().transform(([element]) => {
          return () => {
            if (typeof model !== 'string') {
              throw new Error('expected string as argument to set input')
            }
            debug('set', element, model)
            elementEnterText(element, model)
          }
        })
      },
      model => query => {
        return query
          .is('select')
          .expectOneElement('expected to be select element')
          .css('option')
          .filter(o => o.value === model && elementInnerText(o) === model, `option with text or value ${JSON.stringify(model)}`)
          .expectOneElement(`expected one option element with text or value ${JSON.stringify(model)}`)
          .transform(function ([option]) {
            return () => {
              const selectElement = option.parentNode
              debug('select', selectElement)
              elementSelect(selectElement, option)
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
