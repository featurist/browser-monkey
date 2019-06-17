var window = require('global')
var document = window.document

function Mount (app, options) {
  this.app = app
  this.startApp = options.startApp.bind(this)
  this.stopApp = options.stopApp.bind(this)
}

Mount.prototype.start = function () {
  var monkey = this.startApp()

  monkey.options({
    app: this.app,
    mount: this
  })

  return monkey
}

Mount.prototype.stop = function () {
  this.stopApp()
}

Mount.runningInNode =
  (typeof process !== 'undefined') &&
  (typeof process.versions.node !== 'undefined') &&
  (typeof process.versions.electron === 'undefined')

module.exports = Mount

function addRefreshButton () {
  var refreshLink = document.createElement('a')
  refreshLink.href = window.location.href
  refreshLink.innerText = 'refresh'
  document.body.appendChild(refreshLink)
  document.body.appendChild(document.createElement('hr'))
}

if (Mount.runningInNode) {
  require('./stubBrowser')
} else {
  if (/\/debug\.html$/.test(window.location.pathname)) {
    window.localStorage['debug'] = 'browser-monkey'
    addRefreshButton()
  }
}
