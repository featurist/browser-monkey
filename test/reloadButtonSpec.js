var expect = require('chai').expect
var reloadButton = require('../lib/reloadButton')
var domTest = require('./domTest')

describe('reload button', function () {
  domTest('adds reload button that reloads to the initial url', function (browser) {
    reloadButton()
    return browser.find('a', {text: '⟳ reload'}).shouldHave({
      attributes: {
        href: window.location.href
      }
    })
  }, {vdom: false})

  domTest('removes old buttons before adding new one', function (browser) {
    reloadButton()
    reloadButton()
    reloadButton()

    return browser.find('a', {text: '⟳ reload'}).elements().then(function (elements) {
      expect(elements.length).to.eq(1)
    })
  }, {vdom: false})
})
