var expect = require('chai').expect
var reloadButton = require('../lib/reloadButton')
var describeAssemblies = require('./describeAssemblies')
const {DomAssembly} = require('./assemblies/DomAssembly')

describe('reload button', function () {
  describeAssemblies([DomAssembly], Assembly => {
    var assembly
    var browser

    beforeEach(function () {
      assembly = new Assembly()
      browser = assembly.browserMonkey().withScope(document.body)
    })

    it('adds reload button that reloads to the initial url', function () {
      reloadButton()
      return browser.find('a').containing('⟳ reload').shouldContain(q => {
        expect(q.elementResult().getAttribute('href')).to.equal(window.location.href)
      })
    }, { vdom: false })

    it('removes old buttons before adding new one', function () {
      reloadButton()
      reloadButton()
      reloadButton()

      return browser.find('a', { text: '⟳ reload' }).expectSomeElements().then(function (elements) {
        expect(elements.length).to.eq(1)
      })
    }, { vdom: false })
  })
})
