const elementVisible = require('./elementVisible')

module.exports = function elementQuerySelectorAll (element, selector, selectorOptions) {
  var children = Array.prototype.slice.call(element.querySelectorAll(selector))

  children = selectorOptions.visibleOnly
    ? children.filter(elementVisible)
    : children

  return children
}
