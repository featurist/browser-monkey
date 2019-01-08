const elementInnerText = require('./elementInnerText')

function elementHas (element, index, options) {
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

  return filters.every(function (filter) {
    return filter.filter(element, filter.expected, index)
  })
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

  exactValue: function (element, text) {
    return element.value === text
  },

  index: function (element, expectedIndex, actualIndex) {
    return expectedIndex === actualIndex
  }
}

module.exports = elementHas
