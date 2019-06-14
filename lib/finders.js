var elementMatches = require('./elementMatches')
var elementQuerySelectorAll = require('./elementQuerySelectorAll')
var elementHas = require('./elementHas')
var flatten = require('lowscore/flatten')
var BrowserMonkeyAssertionError = require('./BrowserMonkeyAssertionError').default
var inspect = require('object-inspect')
const { ExecutedSimpleTransform } = require('./ExecutedSimpleTransform')

module.exports = {
  find: function (selector, findOptions) {
    const findElements = this.transform(elements => {
      expectElements(elements)
      return new ExecutedSimpleTransform(flatten(elements.map(element => {
        return elementQuerySelectorAll(element, selector, this._options)
      })), 'find(' + inspect(selector) + ')')
    })

    if (findOptions) {
      return findElements.has(findOptions)
    } else {
      return findElements
    }
  },

  has: function (options) {
    return this.transform(function (elements) {
      expectElements(elements)
      return new ExecutedSimpleTransform(elements.filter(function (element, index) {
        return elementHas(element, index, options)
      }), 'has: ' + inspect(options))
    })
  },

  elementsMatching: function (pattern) {
  },

  is: function (selector) {
    return this.filter(function (element) {
      return elementMatches(element, selector)
    }, 'is: ' + selector)
  },

  containing: function (selector, options) {
    var self = this

    return this.filter(function (element) {
      var foundElements = elementQuerySelectorAll(element, selector, self._options)
      var filteredElements = options
        ? foundElements.filter(function (element, index) {
          return elementHas(element, index, options)
        })
        : foundElements

      return filteredElements.length > 0
    }, 'containing: ' + selector + (options ? ' ' + inspect(options) : ''))
  },

  iframeContent: function () {
    return this.transform(function (elements) {
      return elements.map(element => {
        if (isIframe(element)) {
          if (element.contentDocument && element.contentDocument.readyState === 'complete') {
            return element.contentDocument.body
          } else {
            throw new BrowserMonkeyAssertionError('iframe not loaded')
          }
        } else {
          throw new BrowserMonkeyAssertionError('not iframe')
        }
      })
    }, 'iframeContent')
  },

  scope: function (element) {
    var selector = this.clone()
    selector.input([element])

    if (isIframe(element)) {
      return selector.iframeContent()
    } else if (isHTMLElement(element)) {
      return selector
    } else {
      throw new Error('scope() expects HTML element')
    }
  },

  enabled: function () {
    return this.filter(function (element) {
      var tagName = element.tagName
      return !((tagName === 'BUTTON' || tagName === 'INPUT') && element.disabled)
    }, 'enabled')
  },

  expectNoElements: function (message) {
    return this.expect(elements => {
      expectElements(elements)

      if (elements.length !== 0) {
        this.error(message || 'expected no elements, found ' + elements.length)
      }
    })
  },

  expectOneElement: function (message) {
    return this.expect(elements => {
      expectElements(elements)

      if (elements.length !== 1) {
        this.error(message || 'expected just one element, found ' + elements.length)
      }
    })
  },

  expectSomeElements: function (message) {
    return this.expect(function (elements) {
      expectElements(elements)

      if (elements.length < 1) {
        this.error(message || 'expected one or more elements, found ' + elements.length)
      }
    })
  }
}

function isArrayOfHTMLElements (elements) {
  return elements instanceof Array &&
    elements.every(function (element) {
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

function isIframe (element) {
  return isHTMLElement(element, 'HTMLIFrameElement')
}
