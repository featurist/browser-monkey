var elementFindElements = require('./elementFindElements')
var flatten = require('lowscore/flatten')

module.exports = function (elements, selector, findOptions, selectorOptions) {
  return flatten(
    elements.map(function (element) {
      return elementFindElements(element, selector, findOptions, selectorOptions)
    })
  )
}
