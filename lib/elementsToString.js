module.exports = function elementsToString (els) {
  return els.toArray().map(function (el) {
    if (el && el.outerHTML) { return el.outerHTML.replace(el.innerHTML, '') }
  }).join(', ')
}
