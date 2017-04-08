var div

module.exports = function () {
  if (div && div.parentNode) {
    div.parentNode.removeChild(div)
  }

  div = window.document.createElement('div')
  window.document.body.appendChild(div)

  return div
}
