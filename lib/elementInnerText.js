const normaliseText = require('./normaliseText')

module.exports = function elementInnerText (element, selector) {
  return normaliseText(element.innerText)
}
