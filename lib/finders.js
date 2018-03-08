var flatten = require('lowscore/flatten')
var expect = require('chai').expect
const elementVisible = require('./elementVisible')
const elementMatches = require('./elementMatches')

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

  text: function () {
    return this.element().then(function (element) {
      return element.innerText
    })
  },

  attr: function (name) {
    return this.element().then(function (element) {
      return element.getAttribute(name)
    })
  },

  prop: function (name) {
    return this.element().then(function (element) {
      return element[name]
    })
  },

  html: function () {
    return this.element().then(function (element) {
      return element.innerHTML
    })
  },

  val: function () {
    return this.element().then(function (element) {
      return element.value
    })
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
    }, '[disabled=false]')
  },

  element: function () {
    return this.one().then(function (element) {
      if (isHTMLElement(element)) {
        return element
      } else {
        throw new Error('expected DOM element')
      }
    })
  },

  elements: function () {
    return this.some().then(function (elements) {
      if (isArrayOfHTMLElements(elements)) {
        return elements
      } else {
        throw new Error('expected DOM elements')
      }
    })
  },

  shouldHave: function (options) {
    return this.mapAll(function (elements) {
      expectElements(elements)
      assertElementExpectations(elements, options)
    }, findOptionsToString(options))
  }
}

function toArray (i) {
  return i instanceof Array ? i : [i]
}

var elementExpectations = {
  text: function (elements, expected) {
    var expectedArray = toArray(expected)

    var actual = elements.map(function (element) {
      return element.innerText
    })

    expect(actual).to.eql(expectedArray)
  }
}

function assertElementExpectations (elements, options) {
  Object.keys(options).forEach(key => {
    var expectation = elementExpectations[key]

    if (!expectation) {
      throw new Error('no such expectation ' + key + ', try one of: ' + Object.keys(elementExpectations).join(', '))
    }

    expectation(elements, options[key])
  })
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

function expectOneElement (elements) {
  if (elements.length > 1) {
    throwElementsError(elements, 'expected just one element')
  } else if (elements.length === 0) {
    throw new Error('expected at least one element')
  }
}

function throwElementsError (elements, message) {
  var error = new Error(message)
  error.elements = elements
  throw error
}

var findOptionFilters = {
  text: function (element, text) {
    return element.innerText.indexOf(text) !== -1
  },

  exactText: function (element, text) {
    return element.innerText === text
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

function findOptionsToString (options) {
  return '(' + Object.keys(options).map(function (key) {
    return key + ' = ' + JSON.stringify(options[key])
  }) + ')'
}
