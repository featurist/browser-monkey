var flatten = require('lowscore/flatten')
require('chai').config.truncateThreshold = 0
const elementVisible = require('./elementVisible')
const elementMatches = require('./elementMatches')
const elementInnerText = require('./elementInnerText')
const findOptionsToString = require('./findOptionsToString')

module.exports = {
  find: function (selector, options) {
    var self = this

    return this.mapAll(function (elements) {
      expectElements(elements)
      return flatten(
        elements.map(function (element) {
          return findElements(element, selector, options, self._options)
        })
      )
    }, 'find: ' + selector + (options ? ' ' + findOptionsToString(options) : ''))
  },

  is: function (selector) {
    return this.filter(function (element) {
      return elementMatches(element, selector)
    }, 'is: ' + selector)
  },

  containing: function (selector, options) {
    var self = this

    return this.filter(function (element) {
      return findElements(element, selector, options, self._options).length > 0
    }, 'containing: ' + selector + (options ? ' ' + findOptionsToString(options) : ''))
  },

  iframe: function () {
    return this.map(function (element) {
      if (isIframe(element)) {
        return element.contentDocument.body
      } else {
        return element
      }
    }, 'iframe')
  },

  scope: function (scope) {
    var selector = this.value([scope])

    if (isIframe(scope)) {
      return selector.iframe()
    } else {
      return selector
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
        throw new Error('expected DOM elements')
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
    throwElementsError(elements, 'expected HTML elements')
  }
}

function throwElementsError (elements, message) {
  var error = new Error(message)
  error.elements = elements
  throw error
}

var findOptionFilters = {
  text: function (element, text) {
    if (text === '') {
      return elementInnerText(element) === text
    } else {
      return elementInnerText(element).indexOf(text) !== -1
    }
  },

  exactText: function (element, text) {
    return elementInnerText(element) === text
  },

  index: function (element, expectedIndex, actualIndex) {
    return expectedIndex === actualIndex
  }
}

function findByOptions (elements, options) {
  var filters = Object.keys(options).map(function (key) {
    var filter = findOptionFilters[key]
    if (!filter) {
      throw new Error('no such filter ' + key + ', try one of: ' + Object.keys(findOptionFilters).join(', '))
    }
    return {
      filter: filter,
      expected: options[key]
    }
  })

  return elements.filter(function (element, index) {
    return filters.every(function (filter) {
      return filter.filter(element, filter.expected, index)
    })
  })
}

function isHTMLElement (element, subclass) {
  if (element.ownerDocument && element.ownerDocument.defaultView) {
    // an element inside an iframe
    return element instanceof element.ownerDocument.defaultView[subclass || 'HTMLElement']
  } else {
    return false
  }
}

function findElements (element, selector, findOptions, selectorOptions) {
  var children = Array.prototype.slice.call(element.querySelectorAll(selector))

  children = selectorOptions.visibleOnly
    ? children.filter(elementVisible)
    : children

  children = findOptions
    ? findByOptions(children, findOptions)
    : children

  return children
}

function isIframe (element) {
  return isHTMLElement(element, 'HTMLIFrameElement')
}
