module.exports = function (element) {
  return element.indeterminate
    ? 'indeterminate'
    : element.checked
}
