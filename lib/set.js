var inputsSelector = require('./inputsSelector')
var debug = require('debug')('browser-monkey')
var elementEnterText = require('./elementEnterText')
var elementInnerText = require('./elementInnerText')
const inspect = require('object-inspect')

function assertLength (query, length) {
  const actualLength = query.value().length
  if (actualLength !== length) {
    const error = query.error('expected ' + length + ' elements', { expected: length, actual: actualLength })
    error.executedTransforms.prepend(query._executedTransforms)
    throw error
  }
}

function mapModel (query, elements, model, actions) {
  function map (query, model) {
    if (model instanceof Array) {
      assertLength(query, model.length)

      if (model.length === 0) {
        return function () {}
      } else {
        model.forEach((item, index) => {
          map(query.index(index), item)
        })
      }
    } else if (model.constructor === Object) {
      assertLength(query, 1)
      Object.entries(model).forEach(([selector, value]) => {
        map(query.query(selector), value)
      })
    } else if (typeof model === 'function') {
      actions.function(query, model)
    } else {
      assertLength(query, 1)

      actions.value(query, model)
    }
  }

  map(query, model)

  return actions
}

module.exports = {
  set: function (model) {
    return this.action(function (elements) {
      const setters = []

      const actions = {
        value: (query, model) => {
          var setter = query.setter().value()
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
    return this.assertion(function (elements) {
      const actions = {
        value: (query, model) => {
          var asserter = query.asserter().value()
          query.assertion(() => asserter(model))
        },
        function: (query, model) => {
          model(query)
        }
      }

      const clone = this.clone().resolve()
      mapModel(clone, elements, model, actions)
    })
  },

  index: function (index) {
    return this.transform(function (elements) {
      return [elements[index]]
    }, 'index ' + index)
  },

  length: function (length) {
    return this.assertion(function (results) {
      const actualLength = results.length
      if (actualLength !== length) {
        this.error('expected ' + length + ' elements', { expected: length, actual: actualLength })
      }
    })
  },

  query: function (selector) {
    const field = this._options.definitions.fields[selector]

    if (field) {
      return field(this)
    } else {
      const [finderName, value] = selector.split(':')
      const finder = this._options.definitions.finders[finderName]
      return finder(this, value.trim())
    }
  },

  define: function (name, fieldFinder) {
    this._options.definitions.fields[name] = fieldFinder
  },

  defineFinder: function (name, finder) {
    this._options.definitions.finders[name] = finder
  },

  setter: function () {
    return this.race(this._options.definitions.setters)
  },

  asserter: function () {
    return this.race(this._options.definitions.asserters)
  },

  installSetters: function () {
    this._options.definitions.setters = [
      function (query) {
        return query.is(inputsSelector).element().transform(function (element) {
          return function (text) {
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
      function (query) {
        return query.element().transform(function (element) {
          var self = this
          return function (expected) {
            const actual = elementInnerText(element)
            if (actual !== expected) {
              self.error('expected ' + inspect(actual) + ' to equal ' + inspect(expected), { actual, expected })
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
