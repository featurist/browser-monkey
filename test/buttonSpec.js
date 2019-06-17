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

      const elements = browser.button('Login').result()
      demand(elements).to.eql([button])
    })

    it("doesn't recognise a button without exact text match", function () {
      assembly.insertHtml('<button>Login</button>')

      const elements = browser.button('Logi').result()
      demand(elements).to.eql([])
    })

    it('can recognise an input of type button with exact value', function () {
      var button = assembly.insertHtml('<input type="button" value="Login" />')

      const elements = browser.button('Login').result()
      demand(elements).to.eql([button])
    })

    it("doesn't recognise an input of type button without exact value match", function () {
      assembly.insertHtml('<input type="button" value="Login" />')

      const elements = browser.button('Logi').result()
      demand(elements).to.eql([])
    })

    it('can recognise a link with exact text', function () {
      var button = assembly.insertHtml('<a>Login</a>')

      const elements = browser.button('Login').result()
      demand(elements).to.eql([button])
    })

    it("doesn't recognise a link without exact text match", function () {
      assembly.insertHtml('<a>Login</a>')

      const elements = browser.button('Logi').result()
      demand(elements).to.eql([])
    })

    describe('defineButton', () => {
      it('can define a new button', () => {
        const button = assembly.insertHtml('<div class="button" value="Login">Login</div>')

        browser.defineButton((monkey, name) => monkey.find('div.button', { exactText: name }))

        const elements = browser.button('Login').result()
        demand(elements).to.eql([button])
      })

      it('can define a new button and still use original button definitions', () => {
        const button = assembly.insertHtml('<button>Login</button>')

        browser.defineButton((monkey, name) => monkey.find('div.button', { exactText: name }))

        const elements = browser.button('Login').result()
        demand(elements).to.eql([button])
      })
    })

    describe('clicking a button', () => {
      it('can click a button', () => {
        const events = []
        const button = assembly.insertHtml('<button>Login</button>')
        button.addEventListener('click', () => events.push('click'))

        return browser.click('Login').then(function () {
          demand(events).to.eql(['click'])
        })
      })

      it('can find and click a button', () => {
        const events = []
        const button = assembly.insertHtml('<button>Login</button>')
        button.addEventListener('click', () => events.push('click'))

        return browser.find('button').click().then(function () {
          demand(events).to.eql(['click'])
        })
      })

      it('can click a defined button', () => {
        const events = []
        const button = assembly.insertHtml('<div class="button" value="Login">Login</div>')

        button.addEventListener('click', () => events.push('click'))

        browser.defineButton((monkey, name) => monkey.find('div.button', { exactText: name }))

        return browser.click('Login').then(function () {
          demand(events).to.eql(['click'])
        })
      })
    })
  })
})
