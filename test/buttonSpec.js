var describeAssemblies = require('./describeAssemblies')
const DomAssembly = require('./assemblies/DomAssembly')
var demand = require('must')

describe('buttons', function () {
  describeAssemblies([DomAssembly], function (Assembly) {
    var assembly
    var browser

    beforeEach(function () {
      assembly = new Assembly()
      browser = assembly.browserMonkey()
    })

    it('can recognise a button with exact text', function () {
      var button = assembly.insertHtml('<button>Login</button>')

      return browser.button('Login').then(function (elements) {
        demand(elements).to.eql([button])
      })
    })

    it("doesn't recognise a button without exact text match", function () {
      assembly.insertHtml('<button>Login</button>')

      return browser.button('Logi').then(function (elements) {
        demand(elements).to.eql([])
      })
    })

    it('can recognise an input of type button with exact value', function () {
      var button = assembly.insertHtml('<input type="button" value="Login" />')

      return browser.button('Login').then(function (elements) {
        demand(elements).to.eql([button])
      })
    })

    it("doesn't recognise an input of type button without exact value match", function () {
      assembly.insertHtml('<input type="button" value="Login" />')

      return browser.button('Logi').then(function (elements) {
        demand(elements).to.eql([])
      })
    })

    it('can recognise a link with exact text', function () {
      var button = assembly.insertHtml('<a>Login</a>')

      return browser.button('Login').then(function (elements) {
        demand(elements).to.eql([button])
      })
    })

    it("doesn't recognise a link without exact text match", function () {
      assembly.insertHtml('<a>Login</a>')

      return browser.button('Logi').then(function (elements) {
        demand(elements).to.eql([])
      })
    })
  })
})
