module.exports = function elementsToString(els) {
  return els.toArray().map(function (el) {
    return el.outerHTML.replace(el.innerHTML, '');
  }).join(', ');
}
