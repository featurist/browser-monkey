var href = window.location.href

module.exports = function refreshButton(_options) {
  var options = Object.assign({
    style: true,
    class: 'browser-monkey-refresh'
  }, _options)

  var link = document.createElement('a')
  link.className = options['class']
  link.href = href
  link.innerText = '⟳ reload'

  if (options.style) {
    link.style = 'z-index: 1000;position: fixed;right: 0px;bottom: 0px;background-color: rgba(255, 255, 255, 0.85);padding: 5px 10px;text-decoration: none;color: black;'
  }

  document.body.appendChild(link)
}
