const elementInnerText = require('./elementInnerText')
const elementSelector = require('./elementSelector')
const elementChecked = require('./elementChecked')
const inspect = require('object-inspect')
const BrowserMonkeyAssertionError = require('./BrowserMonkeyAssertionError').default
var expectDeepEqual = require('./expectDeepEqual')
var expectEqual = require('./expectEqual')
var object = require('lowscore/object')
const elementMatches = require('./elementMatches')

module.exports = {
  shouldEqual: function (value) {
    return this.expect(function (result) {
      expectEqual(result, value)
    })
  },

  shouldDeepEqual: function (value) {
    return this.expect(function (result) {
      expectDeepEqual(result, value)
    })
  },

  exists: function (options) {
    return this.shouldExist(options)
  },

  shouldExist: function (options) {
    return this.expectSomeElements()
  },

  shouldHave: function (options) {
    var self = this

    return this.expectSomeElements().expect(function (elements) {
      assertElementExpectations(self, elements, options)
    }, inspect(options))
  },

  shouldFind: function (selector, findOptions) {
    return this.find(selector, findOptions)
      .shouldExist()
  },

  shouldNotExist: function () {
    return this.expectNoElements()
  },

  shouldHaveElement: function (fn) {
    return this.expectOneElement().expect(([el]) => fn(el))
  },

  shouldHaveElements: function (fn, options) {
    return this.expectSomeElements().expect(fn)
  },

  shouldNotHave: function (options) {
    var self = this

    return this.expectSomeElements().expect(function (elements) {
      let thrownError
      try {
        assertElementExpectations(self, elements, options)
        throw (thrownError = new BrowserMonkeyAssertionError('expected elements not to have: ' + JSON.stringify(options)))
      } catch (e) {
        // we expect assertion errors, but nothing else
        if (!(e instanceof BrowserMonkeyAssertionError) || e === thrownError) {
          throw e
        }
      }
    }, inspect(options))
  }
}

function toArray (i) {
  return i instanceof Array ? i : [i]
}

function assertContainsValues (actual, expected) {
  var equal = actual.length === expected.length &&
    actual.every(function (a, index) {
      if (a === undefined) {
        return expected[index] === undefined
      } else if (expected[index] === '') {
        return a === ''
      } else {
        return a.indexOf(expected[index]) !== -1
      }
    })

  if (!equal) {
    var expectedMessage = inspect(expected)
    var actualMessage = inspect(actual)

    throw new BrowserMonkeyAssertionError('expected ' + actualMessage + ' to contain ' + expectedMessage)
  }
}

function queryValue (query, elements) {
  return elements.map(function (element) {
    return query.transform(() => [element]).value().result()
  })
}

var elementExpectations = {
  text: function (query, elements, expected) {
    var expectedArray = toArray(expected)

    var actual = elements.map(function (element) {
      return elementInnerText(element)
    })

    assertContainsValues(actual, expectedArray)
  },

  value: function (query, elements, expected) {
    var expectedArray = toArray(expected)

    var actual = queryValue(query, elements)

    assertContainsValues(actual, expectedArray)
  },

  exactValue: function (query, elements, expected) {
    var expectedArray = toArray(expected)

    var actual = queryValue(query, elements)

    expectDeepEqual(actual, expectedArray, function (actual, expected) {
      return 'expected ' + actual + ' to have exact values ' + expected
    })
  },

  exactText: function (query, elements, expected) {
    var expectedArray = toArray(expected)

    var actual = elements.map(function (element) {
      return elementInnerText(element)
    })

    expectDeepEqual(actual, expectedArray, function (actual, expected) {
      return 'expected ' + actual + ' to have exact inner texts ' + expected
    })
  },

  checked: function (query, elements, expected) {
    var expectedArray = toArray(expected)

    var actual = elements.map(function (element) {
      return elementChecked(element)
    })

    expectDeepEqual(actual, expectedArray, function (actual, expected) {
      return 'expected checked properties ' + actual + ' to equal ' + expected
    })
  },

  css: function (query, elements, expected) {
    var expectedArray = toArray(expected)

    var equal = elements.length === expectedArray.length &&
      elements.every(function (element, index) {
        return elementMatches(element, expectedArray[index])
      })

    if (!equal) {
      var actual = elements.map(function (element) {
        return elementSelector(element)
      })

      var expectedMessage = inspect(expectedArray)
      var actualMessage = inspect(actual)

      throw new BrowserMonkeyAssertionError('expected ' + actualMessage + ' to match css ' + expectedMessage)
    }
  },

  length: function (query, elements, expected) {
    expectEqual(elements.length, expected, function (actual, expected) {
      return 'expected number of elements found ' + actual + ' to equal ' + expected
    })
  },

  attributes: function (query, elements, expected) {
    var expectedArray = toArray(expected)

    var actual = elements.map(function (element, index) {
      var expected = expectedArray[index]

      if (expected) {
        return object(Object.keys(expected).map(function (name) {
          return [name, element.getAttribute(name)]
        }))
      }
    })

    expectDeepEqual(actual, expectedArray, function (actual, expected) {
      return 'expected ' + actual + ' to have attributes ' + expected
    })
  }
}

function assertElementExpectations (query, elements, options) {
  const resolved = query.resolve()

  Object.keys(options).forEach(function (key) {
    var expectation = elementExpectations[key]

    if (!expectation) {
      throw new Error('no such expectation ' + key + ', try one of: ' + Object.keys(elementExpectations).join(', '))
    }

    expectation(resolved, elements, options[key])
  })
}
