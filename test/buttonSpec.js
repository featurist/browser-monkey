var describeAssemblies = require('./describeAssemblies')
const DomAssembly = require('./assemblies/DomAssembly')
var demand = require('must')
const {expect} = require('chai')

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
      async function assertCanClickButton(html, action) {
        const events = []
        assembly.insertHtml(html)
        const button = assembly.find('.target')
        button.addEventListener('click', () => events.push('click'))

        await action()
        expect(events).to.eql(['click'])
      }

      it('can click a button', async () => {
        await assertCanClickButton('<button class="target">Login</button>', () => browser.clickButton('Login'))
      })

      it('can find and click a button', async () => {
        await assertCanClickButton('<button class="target">Login</button>', () => browser.find('Button("Login")').click())
      })

      it('can click a button with selector', async () => {
        await assertCanClickButton('<button class="target">Login</button>', () => browser.click('Button("Login")'))
      })

      it('can click a defined button', async () => {
        browser.defineButton((monkey, name) => monkey.find('div.button').containing(name))
        await assertCanClickButton('<div class="target button">Login</div>', () => browser.click('Button("Login")'))
      })

      it('throws if the button cannot be found to click', async () => {
        browser.defineButton((monkey, name) => monkey.find('div.button').containing(name))
        assembly.insertHtml('<button class="target">Login</button>')
        await assembly.assertRejection(browser.clickButton('Logout'), "expected just one element, found 0 (found: concat(path(find('button, input[type=button], a') [1], containing(...expected 'Login' to equal 'Logout') [0]), path(find('div.button') [0], containing() [0])) [0])")
      })
    })
  })
})
