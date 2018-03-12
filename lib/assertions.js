const elementInnerText = require('./elementInnerText')
const elementSelector = require('./elementSelector')
var errorHandler = require('./errorHandler')
const chai = require('chai')
const inspect = require('chai/lib/chai/utils/inspect')
const expect = chai.expect
var object = require('lowscore/object')
const elementMatches = require('./elementMatches')
const findOptionsToString = require('./findOptionsToString')

module.exports = {
  shouldEqual: function (value) {
    return this.ensure(function (result) {
      expect(result).to.equal(value)
    })
  },

  shouldDeepEqual: function (value) {
    return this.ensure(function (result) {
      expect(result).to.eql(value)
    })
  },

  exists: function (options) {
    return this.shouldExist(options)
  },

  shouldExist: function (options) {
    return this.some()
      .catch(errorHandler(new Error()))
  },

  shouldHave: function (options) {
    return this.elements().ensure(function (elements) {
      assertElementExpectations(elements, options)
    }, findOptionsToString(options))
      .catch(errorHandler(new Error()))
  },

  shouldFind: function (selector, findOptions) {
    return this.find(selector, findOptions)
      .shouldExist()
  },

  shouldNotExist: function () {
    return this.zero()
      .catch(errorHandler(new Error()))
  },

  has: function (options) {
    return this.shouldHave(options)
  },

  shouldHaveElement: function (fn) {
    return this.one().ensure(fn)
  },

  shouldHaveElements: function (fn, options) {
    return this.some().ensure(fn)
  },

  shouldNotHave: function (options) {
    return this.elements().ensure(function (elements) {
      let thrownError
      try {
        assertElementExpectations(elements, options)
        throw (thrownError = new chai.AssertionError('expected elements not to have: ' + JSON.stringify(options)))
      } catch (e) {
        // we expect assertion errors, but nothing else
        if (!(e instanceof chai.AssertionError) || e === thrownError) {
          throw e
        }
      }
    }, findOptionsToString(options))
      .catch(errorHandler(new Error()))
  }
}

function toArray (i) {
  return i instanceof Array ? i : [i]
}

function assertInexactValues (actual, expected) {
  var equal = actual.length === expected.length &&
    actual.every(function (a, index) {
      if (expected[index] === '') {
        return a === ''
      } else {
        return a.indexOf(expected[index]) !== -1
      }
    })

  if (!equal) {
    var expectedMessage = inspect(expected)
    var actualMessage = inspect(actual)

    throw new chai.AssertionError('expected ' + actualMessage + ' to contain ' + expectedMessage)
  }
}

var elementExpectations = {
  text: function (elements, expected) {
    var expectedArray = toArray(expected)

    var actual = elements.map(function (element) {
      return elementInnerText(element)
    })

    assertInexactValues(actual, expectedArray)
  },

  value: function (elements, expected) {
    var expectedArray = toArray(expected)

    var actual = elements.map(function (element) {
      return element.value
    })

    assertInexactValues(actual, expectedArray)
  },

  exactValue: function (elements, expected) {
    var expectedArray = toArray(expected)

    var actual = elements.map(function (element) {
      return element.value
    })

    expect(actual).to.eql(expectedArray)
  },

  exactText: function (elements, expected) {
    var expectedArray = toArray(expected)

    var actual = elements.map(function (element) {
      return elementInnerText(element)
    })

    expect(actual).to.eql(expectedArray)
  },

  checked: function (elements, expected) {
    var expectedArray = toArray(expected)

    var actual = elements.map(function (element) {
      return element.checked
    })

    expect(actual).to.eql(expectedArray)
  },

  css: function (elements, expected) {
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

      throw new chai.AssertionError('expected ' + actualMessage + ' to match css ' + expectedMessage)
    }
  },

  length: function (elements, expected) {
    expect(elements.length).to.equal(expected)
  },

  attributes: function (elements, expected) {
    var expectedArray = toArray(expected)

    var actual = elements.map(function (element, index) {
      var expected = expectedArray[index]

      if (expected) {
        return object(Object.keys(expected).map(function (name) {
          return [name, element.getAttribute(name)]
        }))
      }
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
