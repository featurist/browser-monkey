var elementHas = require('./elementHas')
var flatten = require('lowscore/flatten')
var BrowserMonkeyAssertionError = require('./BrowserMonkeyAssertionError').default
var inspect = require('object-inspect')
const { ExecutedSimpleTransform } = require('./ExecutedSimpleTransform')

module.exports = {
  css: function (selector, findOptions) {
    const findElements = this.transform(elements => {
      expectElements(elements)
      return new ExecutedSimpleTransform(flatten(elements.map(element => {
        return this._dom.querySelectorAll(element, selector, this._options)
      })), 'find(' + inspect(selector) + ')')
    })

    if (findOptions) {
      return findElements.has(findOptions)
    } else {
      return findElements
    }
  },

  find: function (selector, options) {
    // name(value)
    const match = /^\s*(.*?)\s*(\((.*)\)\s*)?$/.exec(selector)

    if (match) {
      const [, name,, value] = match
      const finder = this._options.definitions.fields[name]

      if (finder) {
        if (options) {
          throw new Error('options not used here')
        }

        if (value !== undefined) {
          return finder(this, value.trim())
        } else {
          return finder(this)
        }
      }
    }

    return this.css(selector, options)
  },

  has: function (options) {
    return this.transform(elements => {
      expectElements(elements)
      return new ExecutedSimpleTransform(elements.filter((element, index) => {
        return elementHas(element, index, options)
      }), 'has: ' + inspect(options))
    })
  },

  containingV2: function (selector, options) {
    return this.filter((element) => {
      var foundElements = this._dom.querySelectorAll(element, selector, this._options)
      var filteredElements = options
        ? foundElements.filter((element, index) => {
          return elementHas(element, index, options)
        })
        : foundElements

      return filteredElements.length > 0
    }, 'containing: ' + selector + (options ? ' ' + inspect(options) : ''))
  },
}

function isArrayOfHTMLElements (elements) {
  return elements instanceof Array &&
    elements.every(element => {
      return isHTMLElement(element)
    })
}

function expectElements (elements) {
  if (!isArrayOfHTMLElements(elements)) {
    throw new BrowserMonkeyAssertionError('expected an array of HTML elements')
  }
}

function isHTMLElement (element, subclass) {
  if (element.ownerDocument && element.ownerDocument.defaultView) {
    // an element inside an iframe
    return element instanceof element.ownerDocument.defaultView[subclass || 'HTMLElement']
  } else {
    return false
  }
}
