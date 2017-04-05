var debug = require('debug')('browser-monkey:angular')
var Mount = require('./lib/mount')
var createMonkey = require('./create')
var hobostyle = require('hobostyle')
var createTestDiv = require('./lib/createTestDiv')
var addressBarInterval

module.exports = function (url) {
  return new Mount(url, {
    stopApp: function () {},
    startApp: function () {
      debug('Mounting iframe: ' + url)
      var div = createTestDiv()
      var addressBar = document.createElement('div')
      addressBar.innerText = url
      addressBar.className = 'address-bar'
      div.appendChild(addressBar)

      var iframe = document.createElement('iframe')
      iframe.src = url
      iframe.onload = function () {
        addressBar.innerText = iframe.contentWindow.location.href
      }
      iframe.height = window.innerHeight - addressBar.clientHeight - 10
      div.appendChild(iframe)

      if (addressBarInterval) {
        clearInterval(addressBarInterval)
      }
      addressBarInterval = setInterval(function () {
        if (iframe.contentWindow) {
          addressBar.innerText = iframe.contentWindow.location.href
        } else {
          clearInterval(addressBarInterval)
        }
      }, 300)

      hobostyle.style('html,body { margin: 0; height: 100%; }')
      hobostyle.style('iframe { border: none; width: 100%; }')
      hobostyle.style('.address-bar { padding: 5px; font-family: arial; font-size: 20px; border-bottom: 1px solid gray; }')

      return createMonkey(iframe)
    }
  }).start()
}
