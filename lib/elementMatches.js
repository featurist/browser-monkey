function matchesPolyfill (s) {
  var matches = (this.document || this.ownerDocument).querySelectorAll(s)

  var i = matches.length
  while (--i >= 0 && matches.item(i) !== this) {}
  return i > -1
}

module.exports = function elementMatches (element, selector) {
  if (element.matches) {
    return element.matches(selector)
  } else {
    return matchesPolyfill.call(element, selector)
  }
}
