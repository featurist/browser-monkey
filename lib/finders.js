const elementMatches = require('./elementMatches')
const elementFindElements = require('./elementFindElements')
const elementsFindElements = require('./elementsFindElements')
const findOptionsToString = require('./findOptionsToString')
var BrowserMonkeyAssertionError = require('./BrowserMonkeyAssertionError')

module.exports = {
  find: function (selector, findOptions) {
    var self = this

    return this.mapAll(function (elements) {
      expectElements(elements)
      return elementsFindElements(elements, selector, findOptions, self._options)
    }, 'find: ' + selector + (findOptions ? ' ' + findOptionsToString(findOptions) : ''))
  },

  is: function (selector) {
    return this.filter(function (element) {
      return elementMatches(element, selector)
    }, 'is: ' + selector)
  },

  containing: function (selector, options) {
    var self = this

    return this.filter(function (element) {
      return elementFindElements(element, selector, options, self._options).length > 0
    }, 'containing: ' + selector + (options ? ' ' + findOptionsToString(options) : ''))
  },

  iframe: function () {
    return this.map(function (element) {
      if (isIframe(element)) {
        if (element.contentDocument.body) {
          return element.contentDocument.body
        } else {
          throw new BrowserMonkeyAssertionError('iframe not loaded')
        }
      } else {
        return element
      }
    }, 'iframe')
  },

  scope: function (element) {
    var selector = this.value([element])

    if (isIframe(element)) {
      return selector.iframe()
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
