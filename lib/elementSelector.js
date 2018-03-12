module.exports = function elementSelector (element) {
  var id = element.id
  var classes = element.className.split(/ +/g).filter(Boolean).sort()
  var tag = element.tagName.toLowerCase()

  return (id || '') +
    tag +
    (classes.length ? '.' + classes.join('.') : '')
}
