var elementMatches = require('./elementMatches')
var elementQuerySelectorAll = require('./elementQuerySelectorAll')
var elementHas = require('./elementHas')
var flatten = require('lowscore/flatten')
var BrowserMonkeyAssertionError = require('./BrowserMonkeyAssertionError')
var inspect = require('object-inspect')

module.exports = {
  find: function (selector, findOptions) {
    var self = this

    var findElements = this.mapAll(function (elements) {
      expectElements(elements)
      return flatten(elements.map(function (element) {
        return elementQuerySelectorAll(element, selector, self._options)
      }))
    }, 'find(' + inspect(selector) + ')')

    if (findOptions) {
      return findElements.has(findOptions)
    } else {
      return findElements
    }
  },

  has: function (options) {
    return this.mapAll(function (elements) {
      expectElements(elements)
      return elements.filter(function (element, index) { return elementHas(element, index, options) })
    }, 'has: ' + inspect(options))
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
    return this.map(function (element) {
      if (isIframe(element)) {
        if (element.contentDocument && element.contentDocument.readyState === 'complete') {
          return element.contentDocument.body
        } else {
          throw new BrowserMonkeyAssertionError('iframe not loaded')
        }
      } else {
        throw new BrowserMonkeyAssertionError('not iframe')
      }
    }, 'iframeContent')
  },

  scope: function (element) {
    var selector = this.input([element])

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

  element: function () {
    return this.elements().one()
  },

  elements: function () {
    return this.ensure(function (elements) {
      if (isArrayOfHTMLElements(elements)) {
        return elements
      } else {
        throw new BrowserMonkeyAssertionError('expected DOM elements')
      }
    }, 'elements').some()
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
    throw new BrowserMonkeyAssertionError('expected HTML elements')
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
