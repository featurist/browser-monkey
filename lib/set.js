var inputsSelector = require('./inputsSelector')
var debug = require('debug')('browser-monkey')
var elementClick = require('./elementClick')
var elementChecked = require('./elementChecked')
var elementEnterText = require('./elementEnterText')
var elementInnerText = require('./elementInnerText')
var elementSelect = require('./elementSelect')
const inspect = require('object-inspect')
const object = require('lowscore/object')
const range = require('lowscore/range')
const pluralize = require('pluralize')
const BrowserMonkeyAssertionError = require('./BrowserMonkeyAssertionError').default

function expectLength (query, length) {
  return query.expect(elements => {
    const actualLength = elements.length
    if (actualLength !== length) {
      query.error('expected ' + length + ' ' + pluralize('elements', length) + ', found ' + actualLength)
    }
  })
}

const missing = {}

function spliceModelArrayFromActual (model, query, actions) {
  const length = query.result().length

  if (length > model.length) {
    actions.arrayLengthError(query, length, model.length)
    return range(0, length).map((item, index) => {
      const modelItem = model[index]

      if (modelItem !== undefined) {
        return modelItem
      } else {
        return missing
      }
    })
  } else if (length < model.length) {
    actions.arrayLengthError(query, length, model.length)
    return model.slice(0, length)
  } else {
    return model
  }
}

function mapModel (query, model, actions) {
  function map (query, model) {
    if (model === missing) {
      return query.result().map(e => e.innerText).join()
    } else if (model instanceof Array) {
      return spliceModelArrayFromActual(model, query, actions).map((item, index) => {
        return map(query.index(index), item)
      })
    } else if (model.constructor === Object) {
      return object(Object.entries(model).map(([selector, value]) => {
        return [selector, map(expectLength(query, 1).find(selector), value)]
      }))
    } else if (typeof model === 'function') {
      return actions.function(query, model)
    } else {
      return actions.value(expectLength(query, 1), model)
    }
  }

  return map(query, model)
}

module.exports = {
  set: function (model) {
    return this.action(function (elements) {
      const setters = []

      const actions = {
        arrayLengthError: (query, actualLength, expectedLength) => {
          query.error('expected ' + expectedLength + ' ' + pluralize('elements', expectedLength) + ', found ' + actualLength)
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
        arrayLengthError: () => {
          isError = true
        },

        value: (query, model) => {
          let asserter

          try {
            asserter = query.asserter(model).result()
          } catch (e) {
            if (e instanceof BrowserMonkeyAssertionError) {
              isError = true
              return 'Error: ' + e.message
            } else {
              throw e
            }
          }

          try {
            asserter()
          } catch (e) {
            if (e instanceof BrowserMonkeyAssertionError) {
              isError = true
              return e.actual === undefined ? 'Error: ' + e.message : e.actual
            } else {
              throw e
            }
          }

          return model
        },

        function: (query, model) => {
          try {
            model(query)
            return model
          } catch (e) {
            if (e instanceof BrowserMonkeyAssertionError) {
              isError = true
              return 'Error: ' + e.message
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

  setter: function (model) {
    return this.firstOf(this._options.definitions.fieldTypes.filter(def => def.setter).map(def => {
      return query => def.setter(query, model)
    }))
  },

  asserter: function (expected) {
    return this.firstOf(this._options.definitions.fieldTypes.map(def => {
      return query => def.value(query).transform(actual => {
        return () => {
          if (actual !== expected) {
            this.error('expected ' + inspect(actual) + ' to equal ' + inspect(expected), { actual, expected })
          }
        }
      })
    }))
  },

  defineFieldType: function (fieldTypeDefinition) {
    this._options.definitions.fieldTypes.push(fieldTypeDefinition)
  },

  installSetters: function () {
    this.defineFieldType({
      setter: (query, value) => {
        return query
          .is(inputsSelector)
          .expectOneElement()
          .transform(([element]) => {
            if (typeof value !== 'string') {
              throw new Error('expected string as argument to set input')
            }
            return () => {
              debug('set', element, value)
              elementEnterText(element, value)
            }
          })
      },
      value: (query) => {
        return query.is(inputsSelector).expectOneElement().transform(([input]) => {
          return input.value
        })
      }
    })
    this.defineFieldType({
      setter: (query, value) => {
        return query
          .is('select')
          .expectOneElement('expected to be select element')
          .css('option')
          .filter(o => o.value === value && elementInnerText(o) === value, `option with text or value ${JSON.stringify(value)}`)
          .expectOneElement(`expected one option element with text or value ${JSON.stringify(value)}`)
          .transform(function ([option]) {
            return () => {
              const selectElement = option.parentNode
              debug('select', selectElement)
              elementSelect(selectElement, option)
            }
          })
      },
      value: (query) => {
        return query
          .is('select')
          .expectOneElement('expected to be select element')
          .transform(([select]) => {
            const selectedOption = select.options[select.selectedIndex]
            return selectedOption && elementInnerText(selectedOption)
          })
      }
    })
    this.defineFieldType({
      setter: (query, value) => {
        return query
          .is('input[type=checkbox]')
          .expectOneElement()
          .transform(([checkbox]) => {
            if (typeof value !== 'boolean') {
              throw new Error('expected boolean as argument to set checkbox')
            }
            return () => {
              if (elementChecked(checkbox) !== value) {
                debug('checkbox', checkbox, value)
                elementClick(checkbox)
              }
            }
          })
      },
      value: (query) => {
        return query
          .is('input[type=checkbox]')
          .expectOneElement()
          .transform(([checkbox]) => {
            return elementChecked(checkbox)
          })
      }
    })

    this.defineFieldType({
      value: (query) => {
        return query.expectOneElement().transform(([element]) => {
          return elementInnerText(element)
        })
      }
    })

    return this
  }
}
