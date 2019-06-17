var debug = require('debug')('browser-monkey:iframe')
var Mount = require('./lib/mount')
var createMonkey = require('./create')
var hobostyle = require('hobostyle')
var createTestDiv = require('./lib/createTestDiv')
var { iframeResizer } = require('iframe-resizer')

module.exports = function (url, {resize = false} = {}) {
  return new Mount(url, {
    stopApp: function () {},
    startApp: function () {
      debug('Mounting iframe: ' + url)

      var div = createTestDiv()
      div.className = 'browser-monkey-browser'

      div.innerHTML = `
        <div class="browser-monkey-address-bar">
          <button class="browser-monkey-back-button">&lt;</button>
          <button class="browser-monkey-forward-button">&gt;</button>
          <div class="browser-monkey-address-bar-text"></div>
        </div>
        <iframe class="browser-monkey-iframe"></iframe>
      `

      const addressBar = div.querySelector('.browser-monkey-address-bar')
      const forwardButton = div.querySelector('.browser-monkey-forward-button')
      const backButton = div.querySelector('.browser-monkey-back-button')
      const addressBarText = div.querySelector('.browser-monkey-address-bar-text')
      addressBarText.innerText = url
      const iframe = div.querySelector('.browser-monkey-iframe')

      forwardButton.addEventListener('click', () => {
        iframe.contentWindow.history.forward()
      })

      backButton.addEventListener('click', () => {
        iframe.contentWindow.history.back()
      })

      iframe.src = url
      iframe.addEventListener('load', () => {
        addressBarText.innerText = iframe.contentWindow.location.href

        if (resize) {
          const script = iframe.contentDocument.createElement('script')
          script.src = 'file://' + __dirname + '/node_modules/iframe-resizer/js/iframeResizer.contentWindow.min.js'
          iframe.contentDocument.head.appendChild(script)
        }
      })

      if (resize) {
        iframeResizer({ log: true, checkOrigin: false }, iframe)
      }

      hobostyle.link(__dirname + '/iframe.css')

      return createMonkey(iframe)
    }
  }).start()
}
