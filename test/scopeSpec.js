var demand = require('must')
var describeAssemblies = require('./describeAssemblies')
const DomAssembly = require('./assemblies/DomAssembly')

describe('scope', function () {
  describeAssemblies([DomAssembly], Assembly => {
    var assembly
    var browser

    beforeEach(function () {
      assembly = new Assembly()
      browser = assembly.browserMonkey()
    })

    it('can scope with an element', function () {
      var red = assembly.insertHtml('<div><div class="element">red</div></div>')
      var blue = assembly.insertHtml('<div><div class="element">blue</div></div>')

      return browser.scope(red).find('.element').expectOneElement().then(function ([element]) {
        demand(element.innerText).to.equal('red')
      }).then(function () {
        return browser.scope(blue).find('.element').expectOneElement()
      }).then(function ([element]) {
        demand(element.innerText).to.equal('blue')
      })
    })
  })
})
