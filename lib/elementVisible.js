module.exports = function elementVisible (element) {
  if (element.tagName === 'OPTION' && element.parentNode) {
    return elementVisible(element.parentNode)
  } else {
    return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length)
  }
}
